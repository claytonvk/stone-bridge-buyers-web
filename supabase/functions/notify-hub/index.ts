// supabase/functions/notify-hub/index.ts
//
// Mirrors a quote_form_submissions row into the Site Control dashboard's
// master submission inbox.
//
// The public offer form inserts straight from the browser, so there is no
// server-side step in that path and no safe place to hold the ingest secret.
// This function is that step: point a Supabase Database Webhook at it
// (Database → Webhooks → insert on quote_form_submissions) with a
// `x-hook-secret` header, exactly like the atlas-equipment setup.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Submission = {
  id?: string | number;
  created_at?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  message?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type, x-hook-secret, authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expectedSecret = Deno.env.get("HOOK_SECRET") || "";
  if (!expectedSecret) return json({ error: "Server missing HOOK_SECRET" }, 500);
  if ((req.headers.get("x-hook-secret") || "") !== expectedSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { record?: Submission } | null = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const record = body?.record;
  if (!record) return json({ error: "Missing body.record" }, 400);

  const url = Deno.env.get("HUB_INGEST_URL") || "";
  const secret = Deno.env.get("HUB_INGEST_SECRET") || "";
  const slug = Deno.env.get("HUB_SITE_SLUG") || "";
  if (!url || !secret || !slug) {
    // Not configured yet — succeed quietly so the webhook is not left retrying.
    return json({ ok: true, skipped: "hub not configured" });
  }

  const fullName =
    record.name?.trim() ||
    `${record.first_name ?? ""} ${record.last_name ?? ""}`.trim() ||
    null;

  const address = [record.address, record.city, record.state, record.zip]
    .filter(Boolean)
    .join(", ");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ingest-secret": secret },
      body: JSON.stringify({
        site_slug: slug,
        site_label: Deno.env.get("HUB_SITE_LABEL") || undefined,
        kind: "lead",
        name: fullName ?? undefined,
        email: record.email ?? undefined,
        phone: record.phone ?? undefined,
        subject: address ? `Offer request — ${address}` : "Offer request",
        message: record.message ?? undefined,
        // The row id keeps a retried webhook from creating a duplicate.
        external_id: record.id != null ? String(record.id) : undefined,
        submitted_at: record.created_at ?? new Date().toISOString(),
        payload: { address: address || null },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const details = await res.text();
      console.error(`notify-hub: dashboard returned ${res.status}`, details);
      return json({ ok: false, status: res.status }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("notify-hub failed:", String(e));
    return json({ ok: false, error: String(e) }, 502);
  } finally {
    clearTimeout(timer);
  }
});
