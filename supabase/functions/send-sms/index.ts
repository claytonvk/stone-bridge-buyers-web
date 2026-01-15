// supabase/functions/send-sms/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type OutboxRow = {
  id: number;
  to_phone: string;
  body: string;
  scheduled_at: string;
  status: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function sendViaTwilio(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}) {
  const { accountSid, authToken, from, to, body } = params;

  // Twilio API: POST /2010-04-01/Accounts/{AccountSid}/Messages.json
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const basicAuth = btoa(`${accountSid}:${authToken}`);

  const form = new URLSearchParams();
  form.set("From", from);
  form.set("To", to);
  form.set("Body", body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message || data?.raw || `Twilio error (${res.status})`;
    throw new Error(msg);
  }

  return data; // includes "sid"
}

serve(async (req) => {
  // Preflight (fixes the OPTIONS 405 issue if you ever call this from browser)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // Optional: protect the function (recommended)
  // Require an Authorization header (service role / internal cron / server only)
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) {
    return json({ error: "Missing authorization header" }, { status: 401 });
  }

  // Supabase injected env vars + your secrets
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Your Twilio secrets (set these in Supabase Edge Function secrets)
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
  const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER") || "";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Safety: limit batch size so one run doesn’t explode
  const BATCH_SIZE = 50;

  // Pull queued messages due now
  const { data: due, error: fetchErr } = await supabase
    .from("sms_outbox")
    .select("id, to_phone, body, scheduled_at, status")
    .eq("status", "queued")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchErr) {
    return json({ error: fetchErr.message }, { status: 500 });
  }

  const rows = (due || []) as OutboxRow[];
  if (rows.length === 0) {
    return json({ ok: true, processed: 0 });
  }

  const twilioConfigured =
    !!TWILIO_ACCOUNT_SID && !!TWILIO_AUTH_TOKEN && !!TWILIO_FROM_NUMBER;

  let sent = 0;
  let failed = 0;
  let simulated = 0;

  for (const r of rows) {
    try {
      if (!twilioConfigured) {
        // Simulate for now
        simulated += 1;

        await supabase
          .from("sms_outbox")
          .update({
            status: "simulated",
            sent_at: new Date().toISOString(),
            error: null,
            twilio_message_sid: null,
          })
          .eq("id", r.id);

        continue;
      }

      const tw = await sendViaTwilio({
        accountSid: TWILIO_ACCOUNT_SID,
        authToken: TWILIO_AUTH_TOKEN,
        from: TWILIO_FROM_NUMBER,
        to: r.to_phone,
        body: r.body,
      });

      sent += 1;

      await supabase
        .from("sms_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          error: null,
          twilio_message_sid: tw?.sid || null,
        })
        .eq("id", r.id);
    } catch (e) {
      failed += 1;

      await supabase
        .from("sms_outbox")
        .update({
          status: "failed",
          error: (e as Error)?.message || "Unknown error",
        })
        .eq("id", r.id);
    }
  }

  return json({
    ok: true,
    processed: rows.length,
    sent,
    failed,
    simulated,
    twilioConfigured,
  });
});
