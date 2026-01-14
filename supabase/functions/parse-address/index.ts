import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { address } = await req.json().catch(() => ({}));
    if (!address || String(address).trim().length < 6) {
      return new Response(JSON.stringify({ error: "Missing or invalid address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", String(address));

    const ua = Deno.env.get("NOMINATIM_USER_AGENT") || "StoneBridgeBuyers/1.0";
    const resp = await fetch(url.toString(), {
      headers: { "User-Agent": ua, "Accept": "application/json" },
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "Geocode lookup failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const first = Array.isArray(data) ? data[0] : null;

    if (!first?.address) {
      return new Response(JSON.stringify({ error: "No match found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const a = first.address;

    const houseNumber = a.house_number || "";
    const road = a.road || a.pedestrian || a.footway || "";
    const streetAddress = [houseNumber, road].filter(Boolean).join(" ").trim();

    const city =
      a.city ||
      a.town ||
      a.village ||
      a.hamlet ||
      a.municipality ||
      a.county ||
      "";

    const state = a.state || "";
    const zip = a.postcode || "";
    const unit = "";

    return new Response(
      JSON.stringify({
        street_address: streetAddress,
        unit,
        city,
        state,
        zip,
        raw: first,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
