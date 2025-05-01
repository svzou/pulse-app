// utils/hooks/useUser.ts

import { useState, useEffect } from "react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component"; // ✅ Corrected import

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const supabase = createSupabaseComponentClient(); // ✅ Correct way for your project

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
      } else {
        setUser(data.user);
      }
    }

    fetchUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  return user;
}
