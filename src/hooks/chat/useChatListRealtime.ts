import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Chat, ChatWithUsers } from "@/type/chat/chat";

interface Props {
  currentUserId: number;
  setChats: React.Dispatch<React.SetStateAction<ChatWithUsers[]>>;
}

export function useChatListRealtime({ currentUserId, setChats }: Props) {
  useEffect(() => {
    const channel = supabase
      .channel(`chat-list-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chats" },
        async (payload) => {
          const inserted = payload.new as Chat;
          if (
            inserted.user_id_1 !== currentUserId &&
            inserted.user_id_2 !== currentUserId
          )
            return;

          const res = await fetch("/api/chat/list");
          const json = await res.json();
          if (!json.error) setChats(json.chatList);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chats" },
        (payload) => {
          const updated = payload.new as Chat;
          if (
            updated.user_id_1 !== currentUserId &&
            updated.user_id_2 !== currentUserId
          )
            return;

          setChats((prev) => {
            const isUser1 = updated.user_id_1 === currentUserId;
            const iLeft = isUser1
              ? updated.user_id_1_left
              : updated.user_id_2_left;
            if (!iLeft) return prev.filter((c) => c.id !== updated.id);

            const exists = prev.some((c) => c.id === updated.id);

            if (!exists) {
              fetch("/api/chat/list")
                .then((r) => r.json())
                .then((json) => {
                  if (!json.error) setChats(json.chatList);
                });
              return prev;
            }

            return prev
              .map((c) =>
                c.id === updated.id
                  ? {
                      ...c,
                      last_message_at: updated.last_message_at,
                      last_message_content: updated.last_message_content,
                      user_id_1_unread: updated.user_id_1_unread,
                      user_id_2_unread: updated.user_id_2_unread,
                    }
                  : c,
              )
              .sort((a, b) =>
                (b.last_message_at ?? "").localeCompare(
                  a.last_message_at ?? "",
                ),
              );
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, setChats]);
}
