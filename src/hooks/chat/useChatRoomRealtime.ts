import { supabase } from "@/lib/supabase";
import { Message, MessageWithSender } from "@/type/chat/message";
import { SellerInfo } from "@/type/user";
import { Transaction } from "@/type/transaction";
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
        async (payload) => {
          const newMsg = payload.new as Message;

          // 시스템 메시지는 낙관적 삽입이 없으므로 skip-own을 우회해 양쪽 모두 수신
          if (newMsg.type === "system") {
            const msgWithSender: MessageWithSender = {
              ...newMsg,
              sender: newMsg.sender_id === currentUser.id ? currentUser : partner,
              transaction: null,
            };
            setMessages((prev) =>
              prev.some((m) => m.id === newMsg.id)
                ? prev
                : [...prev, msgWithSender],
            );
            return;
          }

          // 내 메시지는 낙관적 업데이트로 처리 — 리얼타임 중복 방지
          if (newMsg.sender_id === currentUser.id) return;

          // 결제요청 카드 메시지는 연결된 거래 정보를 함께 조회
          let transaction: Transaction | null = null;
          if (newMsg.type === "payment" && newMsg.transaction_id) {
            const { data } = await supabase
              .from("transactions")
              .select("*")
              .eq("id", newMsg.transaction_id)
              .single();
            transaction = (data as Transaction) ?? null;
          }

          const msgWithSender: MessageWithSender = {
            ...newMsg,
            sender: partner,
            transaction,
          };

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
          table: "transactions",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const tx = payload.new as Transaction;
          setMessages((prev) =>
            prev.map((m) =>
              m.transaction_id === tx.id ? { ...m, transaction: tx } : m,
            ),
          );
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
