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

function requireSecret(req: Request) {
  const expected = Deno.env.get("CRON_SECRET") || "";
  if (!expected) return true; // if not set, allow (not recommended)
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

  if (!requireSecret(req)) {
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

    const body = await req.json().catch(() => ({}));
    const lead_id = String(body.lead_id || "").trim();
    const text = String(body.body || "").trim();
    const from_override = body.from_phone ? String(body.from_phone).trim() : "";

    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400,
        headers: cors({ "Content-Type": "application/json" }),
      });
    }
    if (!text) {
      return new Response(JSON.stringify({ error: "body required" }), {
        status: 400,
        headers: cors({ "Content-Type": "application/json" }),
      });
    }

    const { data: lead, error: le } = await sb
      .from("leads")
      .select("id, phone_e164, raw_phone, can_text, sms_subscription, consent_marketing, opted_out_at, status")
      .eq("id", lead_id)
      .single();

    if (le) throw le;

    const to = (lead.phone_e164 || lead.raw_phone || "").trim();
    if (!to) throw new Error("Lead has no phone number");

    const optedOut = !!lead.opted_out_at || lead.status === "do_not_contact";
    if (optedOut) throw new Error("Lead is opted out / do_not_contact");

    if (lead.can_text !== true) throw new Error("Lead can_text is not true");

    // transactional manual send: allow sms_subscription NULL or TRUE; block FALSE
    if (lead.sms_subscription === false) throw new Error("Lead sms_subscription is false");

    const from = from_override || defaultFrom;
    const nowIso = new Date().toISOString();

    const resp = await twilioSend({
      accountSid,
      authToken,
      from,
      to,
      body: text,
    });

    if (!resp.ok) {
      throw new Error(`Twilio ${resp.status}: ${JSON.stringify(resp.json)}`);
    }

    const sid = resp.json?.sid || null;

    // log outbound in lead_notes
    const { error: ne } = await sb.from("lead_notes").insert({
      lead_id: lead.id,
      type: "sms_outbound",
      body: text,
      meta: { to, from, twilio_sid: sid, manual: true },
    });
    if (ne) throw ne;

    // update lead last_contacted_at
    const { error: ue } = await sb.from("leads").update({ last_contacted_at: nowIso }).eq("id", lead.id);
    if (ue) throw ue;

    return new Response(JSON.stringify({ ok: true, sid }), {
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
