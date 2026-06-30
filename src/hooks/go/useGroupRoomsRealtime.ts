import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useGroupRoomsRealtime(enabled: boolean, onChange: () => void) {
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("my-group-rooms")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "meetup_chat_messages" },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onChange]);
}
