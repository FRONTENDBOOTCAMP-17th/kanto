import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/type/user";

const USER_COLUMNS =
  "id, name, email, phone, region, auth_id, avatar_url, provider, role, post_count, created_at, updated_at, deleted_at, suspended_until";

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

  // 제재/해제 알림(common_notifications, type='suspension') 수신 시 users 행을
  // 다시 읽어 authStore.suspended_until 을 즉시 갱신한다. users 테이블 자체에는
  // realtime 구독이 없어, admin 조치가 새로고침 전까지 배너에 반영되지 않던 문제 해결.
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
