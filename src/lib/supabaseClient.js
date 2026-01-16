import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: "supabase.auth.token",
      flowType: "pkce",
    },
    db: {
      schema: "public",
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        "x-client-info": "supabase-js-web",
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      fetch: (...args) => {
        return fetch(...args);
      },
    },
  }
);

export async function invokeEdgeWithSecret(functionName, body) {
  const url = `${
    import.meta.env.VITE_SUPABASE_URL
  }/functions/v1/${functionName}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": import.meta.env.VITE_CRON_SECRET, // only for admin/pro domain
    },
    body: JSON.stringify(body || {}),
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg =
      json?.error || json?.message || `Request failed (${resp.status})`;
    throw new Error(msg);
  }
  return json;
}
