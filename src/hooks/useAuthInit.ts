import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/type/user";

export function useAuthInit() {
  const { setUser, clearUser } = useAuthStore();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 실제 로그아웃일 때만 유저를 비운다.
        // 초기 로드 중 일시적인 세션 없음 이벤트(INITIAL_SESSION 등)가
        // 서버에서 주입해 둔 유저를 덮어써 로그인 버튼이 깜빡이는 문제 방지.
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
