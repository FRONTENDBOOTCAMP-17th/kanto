import { supabase } from "@/lib/supabase";
import { Message, MessageWithSender } from "@/type/chat/message";
import { SellerInfo } from "@/type/user";
import { Transaction } from "@/type/transaction";
import { useEffect, useState } from "react";

interface Props {
  chatId: number | null;
  currentUser: SellerInfo;
  partner: SellerInfo;
  setMessages: React.Dispatch<React.SetStateAction<MessageWithSender[]>>;
}

export function useChatRoomRealtime({
  chatId,
  currentUser,
  partner,
  setMessages,
}: Props) {
  const [partnerOnline, setPartnerOnline] = useState(false);

  useEffect(() => {
    if (chatId === null) return;
    const channel = supabase
      .channel(`chat-room-${chatId}`, {
        config: { presence: { key: String(currentUser.id) } },
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setPartnerOnline(String(partner.id) in state);
      })
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

          if (newMsg.sender_id === currentUser.id) return;

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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ online_at: new Date().toISOString() });
          supabase.rpc("set_chat_active", {
            p_chat_id: chatId,
            p_user_id: currentUser.id,
            p_active: true,
          });
        }
      });

    const handlePageHide = () => {
      supabase.rpc("set_chat_active", {
        p_chat_id: chatId,
        p_user_id: currentUser.id,
        p_active: false,
      });
    };
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      setPartnerOnline(false);
      supabase.rpc("set_chat_active", {
        p_chat_id: chatId,
        p_user_id: currentUser.id,
        p_active: false,
      });
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser.id, partner.id, setMessages]); 

  return { partnerOnline };
}
