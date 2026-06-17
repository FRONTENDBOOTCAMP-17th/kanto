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
export function useChatRoomRealtime({
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

          // 내 메시지는 낙관적 업데이트로 처리 — 리얼타임 중복 방지
          if (newMsg.sender_id === currentUser.id) return;

          const msgWithSender: MessageWithSender = { ...newMsg, sender: partner };

          supabase
            .from("messages")
            .update({ is_read: true })
            .eq("id", newMsg.id)
            .then();

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
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
  // currentUser·partner 객체 전체 대신 .id만 사용 — 참조 변경 시 채널 재구독 방지
  }, [chatId, currentUser.id, partner.id, setMessages]); // eslint-disable-line react-hooks/exhaustive-deps
}
