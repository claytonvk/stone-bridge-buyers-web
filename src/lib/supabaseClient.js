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
        console.log("[Supabase] Fetch:", args[0]);
        return fetch(...args);
      },
    },
  }
);
