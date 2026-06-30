import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/type/user";

const USER_COLUMNS =
  "id, name, email, phone, region, auth_id, avatar_url, provider, role, post_count, kts_score, kts_grade, bank_code, bank_account_number, bank_account_name, created_at, updated_at, deleted_at, suspended_until";

export function useAuthInit() {
  const { setUser, clearUser } = useAuthStore();
  const userId = useAuthStore((s) => s.user?.id);

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
          .select(USER_COLUMNS)
          .eq("auth_id", session.user.id)
          .single();
        if (userData) setUser(userData as User);
      },
    );
    return () => authListener.subscription.unsubscribe();
  }, [setUser, clearUser]);

  
  
  
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`suspension-sync:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "common_notifications",
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          if ((payload.new as { type?: string }).type !== "suspension") return;
          const { data: userData } = await supabase
            .from("users")
            .select(USER_COLUMNS)
            .eq("id", userId)
            .single();
          if (userData) setUser(userData as User);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, setUser]);
}
