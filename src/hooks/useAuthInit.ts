import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/type/user";

export const MANUAL_SIGNOUT_KEY = "kanto-manual-signout";
const ANNOUNCED_SESSION_KEY = "kanto-announced-session";

function getSessionId(accessToken: string): string | null {
  try {
    const payload = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).session_id ?? null;
  } catch {
    return null;
  }
}

const USER_COLUMNS =
  "id, name, email, phone, region, auth_id, avatar_url, provider, role, post_count, kts_score, kts_grade, bank_code, bank_account_number, bank_account_name, created_at, updated_at, deleted_at, suspended_until";

export function useAuthInit() {
  const { setUser, clearUser } = useAuthStore();
  const userId = useAuthStore((s) => s.user?.id);
  const [kickedOut, setKickedOut] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    authId: string;
    sessionId: string;
  } | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          clearUser();
          setActiveSession(null);
          if (localStorage.getItem(MANUAL_SIGNOUT_KEY)) {
            localStorage.removeItem(MANUAL_SIGNOUT_KEY);
          } else {
            setKickedOut(true);
            setTimeout(() => setKickedOut(false), 3000);
          }
          return;
        }
        if (!session) {
          clearUser();
          return;
        }

        const sessionId = getSessionId(session.access_token);
        if (sessionId) {
          setActiveSession((prev) =>
            prev?.sessionId === sessionId
              ? prev
              : { authId: session.user.id, sessionId },
          );
        }

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
    if (!activeSession) return;
    const { authId, sessionId } = activeSession;

    const channel = supabase
      .channel(`session-sync:${authId}`)
      .on("broadcast", { event: "new-login" }, ({ payload }) => {
        if (payload?.sessionId === sessionId) return;
        supabase.auth.signOut({ scope: "local" });
      })
      .subscribe((status) => {
        if (
          status === "SUBSCRIBED" &&
          localStorage.getItem(ANNOUNCED_SESSION_KEY) !== sessionId
        ) {
          localStorage.setItem(ANNOUNCED_SESSION_KEY, sessionId);
          channel.send({
            type: "broadcast",
            event: "new-login",
            payload: { sessionId },
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSession]);

  
  
  
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

  return { kickedOut };
}
