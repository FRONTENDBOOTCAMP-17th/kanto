import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Chat, ChatWithUsers } from "@/type/chat/chat";

interface Props {
  currentUserId: number;
  setChats: React.Dispatch<React.SetStateAction<ChatWithUsers[]>>;
}

const CHAT_LIST_SELECT = `*,
  user1:public_profiles!chats_user_id_1_fkey(id, name, avatar_url, created_at),
  user2:public_profiles!chats_user_id_2_fkey(id, name, avatar_url, created_at),
  posts(title, post_type)`;

export function useChatListRealtime({ currentUserId, setChats }: Props) {
  useEffect(() => {
    const handleInsert = async (payload: { new: Chat }) => {
      const { data } = await supabase
        .from("chats")
        .select(CHAT_LIST_SELECT)
        .eq("id", payload.new.id)
        .single();
      if (data) setChats((prev) => [data as ChatWithUsers, ...prev]);
    };

    const handleUpdate = (payload: { new: Chat }) => {
      const updated = payload.new;
      setChats((prev) => {
        const isUser1 = updated.user_id_1 === currentUserId;
        const iLeft = isUser1 ? updated.user_id_1_left : updated.user_id_2_left;
        if (iLeft) return prev.filter((c) => c.id !== updated.id);

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
            (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""),
          );
      });
    };

    const ch1 = supabase
      .channel(`chat-list-user1-${currentUserId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chats",
        filter: `user_id_1=eq.${currentUserId}`,
      }, handleInsert)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "chats",
        filter: `user_id_1=eq.${currentUserId}`,
      }, handleUpdate)
      .subscribe();

    const ch2 = supabase
      .channel(`chat-list-user2-${currentUserId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chats",
        filter: `user_id_2=eq.${currentUserId}`,
      }, handleInsert)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "chats",
        filter: `user_id_2=eq.${currentUserId}`,
      }, handleUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [currentUserId, setChats]);
}
