import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function clampNumber(n: unknown, fallback: number) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

async function fetchJson(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Umami request failed (${res.status}): ${text || res.statusText}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Umami returned non-JSON (${res.status}): ${text.slice(0, 180)}`);
  }
}

function withQuery(url: string, params: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v);
    if (!s.length) return;
    p.set(k, s);
  });
  return `${url}?${p.toString()}`;
}

async function umamiGet(baseUrl: string, prefix: string, path: string, apiKey: string, query?: Record<string, string | number | undefined>) {
  const root = baseUrl.replace(/\/+$/, "");
  const pre = prefix ? `/${prefix.replace(/^\/+|\/+$/g, "")}` : "";
  const pth = path.startsWith("/") ? path : `/${path}`;
  const url = query ? withQuery(`${root}${pre}${pth}`, query) : `${root}${pre}${pth}`;
  return fetchJson(url, { Accept: "application/json", "x-umami-api-key": apiKey });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const expectedSecret = cleanStr(Deno.env.get("ADMIN_SECRET"));
    if (expectedSecret) {
      const got = req.headers.get("x-admin-secret") || "";
      if (got !== expectedSecret) return json({ error: "Forbidden" }, 403);
    }

    const apiKey = cleanStr(Deno.env.get("UMAMI_API_KEY"));
    if (!apiKey) return json({ error: "Missing UMAMI_API_KEY" }, 500);

    const baseUrl = cleanStr(Deno.env.get("UMAMI_BASE_URL")) || "https://api.umami.is";
    const prefix = cleanStr(Deno.env.get("UMAMI_API_PREFIX")) || "v1";

    const body = await req.json().catch(() => ({}));

    const websiteId = cleanStr(body?.websiteId) || cleanStr(Deno.env.get("UMAMI_WEBSITE_ID"));
    if (!websiteId) return json({ error: "Missing websiteId (send body.websiteId or set UMAMI_WEBSITE_ID)" }, 400);

    const startAt = clampNumber(body?.startAt, Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endAt = clampNumber(body?.endAt, Date.now());
    const timezone = cleanStr(body?.timezone) || "Pacific/Honolulu";
    const unit = cleanStr(body?.unit) || "day";

    const qs = { startAt, endAt, timezone, unit };

    const [active, stats, pageviews, topPages, topReferrers, topCountries, topDevices, topBrowsers] = await Promise.all([
      umamiGet(baseUrl, prefix, `/websites/${websiteId}/active`, apiKey),
      umamiGet(baseUrl, prefix, `/websites/${websiteId}/stats`, apiKey, qs),
      umamiGet(baseUrl, prefix, `/websites/${websiteId}/pageviews`, apiKey, qs),
      umamiGet(baseUrl, prefix, `/websites/${websiteId}/metrics`, apiKey, { ...qs, type: "path", limit: 10 }),
      umamiGet(baseUrl, prefix, `/websites/${websiteId}/metrics`, apiKey, { ...qs, type: "referrer", limit: 10 }),
      umamiGet(baseUrl, prefix, `/websites/${websiteId}/metrics`, apiKey, { ...qs, type: "country", limit: 10 }),
      umamiGet(baseUrl, prefix, `/websites/${websiteId}/metrics`, apiKey, { ...qs, type: "device", limit: 10 }),
      umamiGet(baseUrl, prefix, `/websites/${websiteId}/metrics`, apiKey, { ...qs, type: "browser", limit: 10 }),
    ]);

    return json({
      range: { startAt, endAt, unit, timezone },
      active,
      stats,
      series: pageviews,
      topPages,
      topReferrers,
      topCountries,
      topDevices,
      topBrowsers,
    });
  } catch (e) {
    return json({ error: e?.message ?? String(e) }, 500);
  }
});
