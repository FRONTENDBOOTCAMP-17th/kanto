import { supabase } from "@/lib/supabase";
import { Message, MessageWithSender } from "@/type/chat/message";
import { SellerInfo } from "@/type/user";
import { useEffect } from "react";

interface Props {
  chatId: number;
  currentUser: SellerInfo;
  partner: SellerInfo;
  setMessages: React.Dispatch<React.SetStateAction<MessageWithSender[]>>;
}

/** 채팅 리얼타임 함수 */
export function useChatRealtime({
  chatId,
  currentUser,
  partner,
  setMessages,
}: Props) {
  useEffect(() => {
    const channel = supabase
      .channel(`chat-room-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          const sender =
            newMsg.sender_id === currentUser.id ? currentUser : partner;
          const msgWithSender: MessageWithSender = { ...newMsg, sender };

          if (newMsg.sender_id !== currentUser.id) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then();
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            if (newMsg.sender_id === currentUser.id) {
              const idx = prev.findIndex(
                (m) =>
                  m.id > 1e12 &&
                  m.sender_id === currentUser.id &&
                  m.content === newMsg.content,
              );
              if (idx !== -1) {
                const updated = [...prev];
                updated[idx] = msgWithSender;
                return updated;
              }
            }

            return [...prev, msgWithSender];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id
                ? { ...m, is_read: payload.new.is_read }
                : m,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser, partner]);
}
