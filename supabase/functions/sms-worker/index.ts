import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function cors(headers: HeadersInit = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    ...headers,
  };
}

function requireCronSecret(req: Request) {
  const expected = Deno.env.get("CRON_SECRET") || "";
  if (!expected) return true; // if unset, allow (not recommended)
  const got = req.headers.get("x-cron-secret") || "";
  return got && got === expected;
}

async function twilioSend({
  accountSid,
  authToken,
  from,
  to,
  body,
}: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const form = new URLSearchParams();
  form.set("From", from);
  form.set("To", to);
  form.set("Body", body);

  const basic = btoa(`${accountSid}:${authToken}`);

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const json = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, json };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: cors({ "Content-Type": "application/json" }),
    });
  }

  if (!requireCronSecret(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: cors({ "Content-Type": "application/json" }),
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
    const defaultFrom = Deno.env.get("TWILIO_FROM_NUMBER") || "";

    if (!accountSid || !authToken || !defaultFrom) {
      throw new Error("Missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER secrets");
    }

    const nowIso = new Date().toISOString();

    // Pull due items. We do it in 2 steps:
    // 1) select candidates
    // 2) attempt to "claim" each by bumping attempts (cheap lock)
    // This avoids needing raw SQL FOR UPDATE in Edge functions.
    const { data: due, error: de } = await sb
      .from("sms_outbox")
      .select(`
        id,
        lead_id,
        flow_id,
        step_id,
        to_phone,
        from_phone,
        body,
        scheduled_at,
        status,
        attempts,
        leads:lead_id ( id, can_text, sms_subscription, consent_marketing, opted_out_at, status ),
        sms_flows:flow_id ( id, kind, status ),
        sms_flow_steps:step_id ( id, step_order, delay_minutes, set_status )
      `)
      .eq("status", "queued")
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(50);

    if (de) throw de;

    let sent = 0;
    let failed = 0;
    let canceled = 0;

    for (const item of due || []) {
      const lead = item.leads;
      const flow = item.sms_flows;
      const step = item.sms_flow_steps;

      // Claim: increment attempts only if still queued
      const { data: claimed, error: ce } = await sb
        .from("sms_outbox")
        .update({ attempts: (item.attempts ?? 0) + 1 })
        .eq("id", item.id)
        .eq("status", "queued")
        .select("id")
        .maybeSingle();

      if (ce) {
        console.error("claim error", ce);
        continue;
      }
      if (!claimed) continue; // someone else claimed or status changed

      // Consent checks (send-time enforcement)
      const optedOut = !!lead?.opted_out_at || lead?.status === "do_not_contact";
      const canText = lead?.can_text === true;

      const smsSub = lead?.sms_subscription; // true/false/null
      const mkt = lead?.consent_marketing === true;

      const flowActive = flow?.status === "active";
      if (!flowActive || optedOut || !canText) {
        await sb.from("sms_outbox").update({
          status: "canceled",
          last_error: !flowActive ? "Flow not active" : optedOut ? "Opted out / DNC" : "can_text false",
        }).eq("id", item.id);
        canceled++;
        continue;
      }

      if (flow.kind === "marketing") {
        if (!(smsSub === true && mkt === true)) {
          await sb.from("sms_outbox").update({
            status: "canceled",
            last_error: "Marketing requires sms_subscription=true and consent_marketing=true",
          }).eq("id", item.id);
          canceled++;
          continue;
        }
      } else {
        // transactional: allow sms_subscription NULL or TRUE; block FALSE
        if (smsSub === false) {
          await sb.from("sms_outbox").update({
            status: "canceled",
            last_error: "sms_subscription=false",
          }).eq("id", item.id);
          canceled++;
          continue;
        }
      }

      const fromPhone = item.from_phone || defaultFrom;
      const toPhone = item.to_phone;

      const resp = await twilioSend({
        accountSid,
        authToken,
        from: fromPhone,
        to: toPhone,
        body: item.body,
      });

      if (!resp.ok) {
        await sb.from("sms_outbox").update({
          status: "failed",
          last_error: `Twilio ${resp.status}: ${JSON.stringify(resp.json)}`.slice(0, 900),
        }).eq("id", item.id);
        failed++;
        continue;
      }

      const twilioSid = resp.json?.sid || null;

      // Mark sent
      await sb.from("sms_outbox").update({
        status: "sent",
        sent_at: nowIso,
        twilio_sid: twilioSid,
        last_error: null,
      }).eq("id", item.id);

      // Log outbound note
      await sb.from("lead_notes").insert({
        lead_id: item.lead_id,
        type: "sms_outbound",
        body: item.body,
        meta: { to: toPhone, from: fromPhone, twilio_sid: twilioSid, outbox_id: item.id },
      });

      // Update lead last_contacted_at
      await sb.from("leads").update({
        last_contacted_at: nowIso,
      }).eq("id", item.lead_id);

      // Update enrollment tracking
      await sb.from("lead_flow_enrollments").update({
        current_step_order: step?.step_order ?? null,
        last_step_sent_at: nowIso,
      }).eq("lead_id", item.lead_id).eq("flow_id", item.flow_id);

      // Optional: step can set lead.status
      if (step?.set_status) {
        await sb.from("leads").update({
          status: step.set_status,
          status_updated_at: nowIso,
        }).eq("id", item.lead_id);
      }

      // Enqueue next step (if exists and enrollment not completed/paused)
      const { data: enrollment } = await sb
        .from("lead_flow_enrollments")
        .select("paused_at, completed_at")
        .eq("lead_id", item.lead_id)
        .eq("flow_id", item.flow_id)
        .maybeSingle();

      if (!enrollment?.paused_at && !enrollment?.completed_at) {
        const nextOrder = (step?.step_order ?? -1) + 1;

        const { data: nextStep } = await sb
          .from("sms_flow_steps")
          .select("id, delay_minutes, body")
          .eq("flow_id", item.flow_id)
          .eq("step_order", nextOrder)
          .maybeSingle();

        if (nextStep?.id) {
          const scheduledAt = new Date(Date.now() + (Number(nextStep.delay_minutes || 0) * 60_000)).toISOString();

          await sb.from("sms_outbox").insert({
            lead_id: item.lead_id,
            flow_id: item.flow_id,
            step_id: nextStep.id,
            to_phone: toPhone,
            from_phone: fromPhone,
            body: nextStep.body,
            scheduled_at: scheduledAt,
          }).catch(() => {});
        } else {
          // no next step => mark enrollment completed
          await sb.from("lead_flow_enrollments").update({
            completed_at: nowIso,
          }).eq("lead_id", item.lead_id).eq("flow_id", item.flow_id);
        }
      }

      sent++;
    }

    return new Response(JSON.stringify({ ok: true, processed: (due || []).length, sent, failed, canceled }), {
      status: 200,
      headers: cors({ "Content-Type": "application/json" }),
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: cors({ "Content-Type": "application/json" }),
    });
  }
});
