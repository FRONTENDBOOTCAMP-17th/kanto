import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/type/user";

export function useAuthInit() {
  const { setUser, clearUser } = useAuthStore();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          clearUser();
          return;
        }
        if (!session) return;

        const { data: userData } = await supabase
          .from("users")
          .select(
            "id, name, email, phone, auth_id, avatar_url, provider, role, post_count, created_at, updated_at, deleted_at, suspended_until",
          )
          .eq("auth_id", session.user.id)
          .single();
        if (userData) setUser(userData as User);
      },
    );
    return () => authListener.subscription.unsubscribe();
  }, [setUser, clearUser]);
}
