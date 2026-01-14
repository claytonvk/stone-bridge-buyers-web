import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthCtx } from "./AuthCtx";

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;

        if (error) {
          setSession(null);
          setReady(true);
          return;
        }

        setSession(data?.session ?? null);
        setReady(true);
      } catch {
        if (!alive) return;
        setSession(null);
        setReady(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, nextSession) => {
      if (!alive) return;
      setSession(nextSession);
      setReady(true);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ ready, session }), [ready, session]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
