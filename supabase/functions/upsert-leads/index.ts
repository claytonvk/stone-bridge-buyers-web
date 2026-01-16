import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type IncomingLead = {
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  street_address?: string;
  unit?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  raw_address?: string;

  can_text?: boolean;

  // null = unknown
  sms_subscription?: boolean | null;
  consent_marketing?: boolean | null;

  status?: string;
  source?: string;
  source_ref?: string;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(resBody: unknown, status = 200) {
  return new Response(JSON.stringify(resBody), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function triBool(v: unknown): boolean | null {
  if (v === true) return true;
  if (v === false) return false;
  return null;
}

// US-default phone normalization
function normalizePhoneE164(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/[^0-9]/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+")) {
    if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
    return null;
  }

  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return json(
        { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        500
      );
    }

    // Optional safety (recommended): require a shared secret header
    // Set ADMIN_SECRET in Edge Function secrets, then pass x-admin-secret from your admin panel.
    // If you truly want it open, delete this block.
    const expectedSecret = Deno.env.get("ADMIN_SECRET");
    if (expectedSecret) {
      const got = req.headers.get("x-admin-secret") || "";
      if (got !== expectedSecret) return json({ error: "Forbidden" }, 403);
    }

    // Service role bypasses RLS
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.leads)) {
      return json({ error: "Body must be { leads: [...] }" }, 400);
    }

    const incoming: IncomingLead[] = body.leads;
    const nowIso = new Date().toISOString();

    const invalid: Array<{ index: number; phone: string | null; reason: string }> = [];

    const rows = incoming
      .map((l, index) => {
        const rawPhone = cleanStr(l.phone);
        const e164 = normalizePhoneE164(rawPhone);

        if (!e164) {
          invalid.push({
            index,
            phone: rawPhone,
            reason: "Invalid or unsupported phone format",
          });
          return null;
        }

        // ✅ Defaults you requested:
        // - New lead: can_text true
        // - sms_subscription null unless explicitly true/false
        // - consent_marketing null unless explicitly true/false
        const can_text =
          typeof l.can_text === "boolean" ? l.can_text : true;

        const sms_subscription = triBool(l.sms_subscription); // null by default
        const consent_marketing = triBool(l.consent_marketing); // null by default

        return {
          phone_e164: e164,
          raw_phone: rawPhone,

          email: cleanStr(l.email),
          first_name: cleanStr(l.first_name),
          last_name: cleanStr(l.last_name),

          street_address: cleanStr(l.street_address),
          unit: cleanStr(l.unit),
          city: cleanStr(l.city),
          state: cleanStr(l.state),
          zipcode: cleanStr(l.zipcode),
          raw_address: cleanStr(l.raw_address),

          can_text,
          sms_subscription,
          consent_marketing,

          status: cleanStr(l.status) ?? "new",
          status_updated_at: nowIso,

          source: cleanStr(l.source) ?? "csv_import",
          source_ref: cleanStr(l.source_ref),

          updated_at: nowIso,
        };
      })
      .filter(Boolean) as any[];

    if (rows.length === 0) {
      return json({
        inserted: 0,
        updated: 0,
        skipped_invalid: invalid.length,
        invalid,
      });
    }

    const phones = rows.map((r) => r.phone_e164);

    const { data: existing, error: fetchErr } = await supabase
      .from("leads")
      .select(
        "id, phone_e164, email, first_name, last_name, street_address, unit, city, state, zipcode, raw_address, can_text, sms_subscription, consent_marketing, opted_out_at, status"
      )
      .in("phone_e164", phones);

    if (fetchErr) return json({ error: fetchErr.message }, 500);

    const existingMap = new Map((existing || []).map((e: any) => [e.phone_e164, e]));

    let inserted = 0;
    let updated = 0;

    const merged = rows.map((r) => {
      const ex = existingMap.get(r.phone_e164);

      // INSERT
      if (!ex) {
        inserted += 1;
        // If you ever insert a lead that is already opted out (rare), still protect can_text
        return r;
      }

      // UPDATE
      updated += 1;

      // Keep existing values if incoming is null
      const sms_subscription =
        r.sms_subscription === null ? ex.sms_subscription : r.sms_subscription;

      const consent_marketing =
        r.consent_marketing === null ? ex.consent_marketing : r.consent_marketing;

      // Never clear opt-out, and never allow can_text=true if opted out
      const opted_out_at = ex.opted_out_at;
      const can_text = opted_out_at ? false : r.can_text;

      // Don't downgrade status if already beyond "new"
      const status = ex.status && ex.status !== "new" ? ex.status : r.status;

      return {
        ...r,
        id: ex.id,

        // merge: don't overwrite existing with null
        email: r.email ?? ex.email,
        first_name: r.first_name ?? ex.first_name,
        last_name: r.last_name ?? ex.last_name,

        street_address: r.street_address ?? ex.street_address,
        unit: r.unit ?? ex.unit,
        city: r.city ?? ex.city,
        state: r.state ?? ex.state,
        zipcode: r.zipcode ?? ex.zipcode,
        raw_address: r.raw_address ?? ex.raw_address,

        can_text,
        sms_subscription,
        consent_marketing,
        opted_out_at,

        status,
      };
    });

    const { error: upsertErr } = await supabase
      .from("leads")
      .upsert(merged, { onConflict: "phone_e164" });

    if (upsertErr) return json({ error: upsertErr.message }, 500);

    return json({
      inserted,
      updated,
      skipped_invalid: invalid.length,
      invalid,
    });
  } catch (e) {
    return json({ error: e?.message ?? String(e) }, 500);
  }
});
