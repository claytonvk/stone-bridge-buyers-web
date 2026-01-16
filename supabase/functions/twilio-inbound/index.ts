import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function cors(headers: HeadersInit = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    ...headers,
  };
}

// ---- Twilio signature verification (optional but recommended) ----
// If you set TWILIO_VERIFY_SIGNATURE="true", we verify X-Twilio-Signature.
// Requires TWILIO_AUTH_TOKEN.
async function verifyTwilioSignature(req: Request, params: Record<string, string>) {
  const verify = (Deno.env.get("TWILIO_VERIFY_SIGNATURE") || "false").toLowerCase() === "true";
  if (!verify) return true;

  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!authToken) return false;

  const sig = req.headers.get("x-twilio-signature") || "";
  if (!sig) return false;

  // Twilio signature base string = full URL + concatenated params (sorted by key, key+value)
  const url = req.url;
  const keys = Object.keys(params).sort();
  let data = url;
  for (const k of keys) data += k + params[k];

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(mac)));

  // constant-ish time compare
  if (b64.length !== sig.length) return false;
  let ok = 0;
  for (let i = 0; i < b64.length; i++) ok |= b64.charCodeAt(i) ^ sig.charCodeAt(i);
  return ok === 0;
}

function normalizeInbound(body: string) {
  const text = (body || "").trim();
  const up = text.toUpperCase();

  const isStop = ["STOP", "CANCEL", "END", "UNSUBSCRIBE", "QUIT"].includes(up);
  const isStart = ["START", "YES", "UNSTOP"].includes(up);
  const isHelp = up === "HELP";

  return { text, up, isStop, isStart, isHelp };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: cors({ "Content-Type": "application/json" }),
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Twilio sends x-www-form-urlencoded
    const form = await req.formData();
    const params: Record<string, string> = {};
    for (const [k, v] of form.entries()) params[k] = String(v);

    const ok = await verifyTwilioSignature(req, params);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Invalid Twilio signature" }), {
        status: 401,
        headers: cors({ "Content-Type": "application/json" }),
      });
    }

    const from = (params.From || "").trim(); // E164
    const to = (params.To || "").trim();     // your Twilio number
    const body = (params.Body || "").trim();
    const msgSid = (params.MessageSid || "").trim();

    if (!from || !body) {
      return new Response(JSON.stringify({ error: "Missing From/Body" }), {
        status: 400,
        headers: cors({ "Content-Type": "application/json" }),
      });
    }

    const { text, isStop, isStart, isHelp } = normalizeInbound(body);
    const now = new Date().toISOString();

    // Find lead by phone_e164 first
    let lead = null as any;

    {
      const { data } = await sb
        .from("leads")
        .select("id, sms_subscription, can_text, opted_out_at, status")
        .eq("phone_e164", from)
        .maybeSingle();

      lead = data;
    }

    // If not found, try raw_phone exact
    if (!lead) {
      const { data } = await sb
        .from("leads")
        .select("id, sms_subscription, can_text, opted_out_at, status")
        .eq("raw_phone", from)
        .maybeSingle();
      lead = data;
    }

    // If still not found, create lead
    if (!lead) {
      const { data: created, error: ce } = await sb
        .from("leads")
        .insert({
          raw_phone: from,
          phone_e164: from,
          source: "twilio_inbound",
          status: "new",
          status_updated_at: now,

          // Your desired defaults:
          can_text: true,
          sms_subscription: null,
          consent_marketing: null,
        })
        .select("id, sms_subscription, can_text, opted_out_at, status")
        .single();

      if (ce) throw ce;
      lead = created;
    }

    // Always log inbound message
    {
      const { error: ne } = await sb.from("lead_notes").insert({
        lead_id: lead.id,
        type: "sms_inbound",
        body: text,
        meta: { from, to, message_sid: msgSid },
      });
      if (ne) throw ne;
    }

    // Update lead consent/status based on keywords
    const leadPatch: any = {
      last_inbound_at: now,
    };

    if (isStop) {
      leadPatch.sms_subscription = false;
      leadPatch.can_text = false;
      leadPatch.opted_out_at = now;
      leadPatch.status = "do_not_contact";
      leadPatch.status_updated_at = now;
    } else if (isStart) {
      leadPatch.sms_subscription = true;
      leadPatch.can_text = true;
      leadPatch.opted_out_at = null;
      // don’t force status; but you can if you want:
      if (lead.status === "do_not_contact") {
        leadPatch.status = "contacted";
        leadPatch.status_updated_at = now;
      }
    } else if (!isHelp) {
      // Normal reply: if unknown (NULL) subscription, treat as subscribed
      if (lead.sms_subscription === null) leadPatch.sms_subscription = true;
      leadPatch.can_text = true;

      // Business rule: inbound reply => engaged
      if (lead.status !== "do_not_contact") {
        leadPatch.status = "engaged";
        leadPatch.status_updated_at = now;
      }
    }

    const { error: ue } = await sb.from("leads").update(leadPatch).eq("id", lead.id);
    if (ue) throw ue;

    // If flow.stop_on_reply = true: cancel queued messages + complete enrollments (for active flows)
    if (!isStop) {
      const { data: enrolls } = await sb
        .from("lead_flow_enrollments")
        .select("flow_id, sms_flows:flow_id(stop_on_reply, status)")
        .eq("lead_id", lead.id)
        .is("completed_at", null);

      const activeStopFlows =
        (enrolls || [])
          .filter((e: any) => e.sms_flows?.status === "active" && e.sms_flows?.stop_on_reply === true)
          .map((e: any) => e.flow_id);

      if (activeStopFlows.length) {
        // cancel queued outbox rows
        await sb
          .from("sms_outbox")
          .update({ status: "canceled", last_error: "Stopped on reply" })
          .eq("lead_id", lead.id)
          .in("flow_id", activeStopFlows)
          .eq("status", "queued");

        // mark enrollments completed
        await sb
          .from("lead_flow_enrollments")
          .update({ completed_at: now, last_inbound_at: now })
          .eq("lead_id", lead.id)
          .in("flow_id", activeStopFlows)
          .is("completed_at", null);
      } else {
        // still update last_inbound_at on enrollments
        await sb
          .from("lead_flow_enrollments")
          .update({ last_inbound_at: now })
          .eq("lead_id", lead.id)
          .is("completed_at", null);
      }
    }

    // Twilio expects TwiML or 200 OK; we can just 200 OK.
    // You can optionally reply with a message on HELP/STOP confirmations later.
    return new Response(JSON.stringify({ ok: true }), {
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
