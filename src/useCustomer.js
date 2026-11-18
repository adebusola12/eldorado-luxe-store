import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Keeps track of the signed-in customer (if any) for the whole storefront.
export function useCustomer() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.session?.user ?? null);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);

      // Customer clicked the "reset password" link in their email
      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return { user, ready, recovery, clearRecovery: () => setRecovery(false) };
}

export function displayName(user) {
  return (
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "there"
  );
}