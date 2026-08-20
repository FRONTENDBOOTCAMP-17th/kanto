import { useState, type Dispatch, type SetStateAction } from "react";
import { createChatAndSendAction, sendMessageAction } from "../../../../actions";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";

interface Params {
  activeChatId: number | null;
  postId: number;
  partner: SellerInfo;
  currentUser: SellerInfo;
  setMessages: Dispatch<SetStateAction<MessageWithSender[]>>;
  recordSend: () => boolean;
  onChatCreated: (newChatId: number) => void;
  onError: (message: string) => void;
}

/** 입력값을 관리하고, 전송 시 낙관적 업데이트 후 신규/기존 채팅방에 메시지를 보낸다. */
export function useSendMessage({
  activeChatId,
  postId,
  partner,
  currentUser,
  setMessages,
  recordSend,
  onChatCreated,
  onError,
}: Params) {
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    if (recordSend()) {
      setInput("");
      return;
    }

    const content = input.trim();
    setInput("");

    const tempId = Date.now();
    const optimistic: MessageWithSender = {
      id: tempId,
      created_at: new Date().toISOString(),
      chat_id: activeChatId ?? 0,
      sender_id: currentUser.id,
      post_id: postId,
      content,
      is_read: false,
      type: "text",
      transaction_id: null,
      sender: currentUser,
      tempId,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      if (activeChatId === null) {
        const { chatId: newChatId, message: saved } = await createChatAndSendAction({
          partnerUserId: partner.id,
          postId,
          content,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId
              ? { ...m, id: saved.id, chat_id: newChatId, tempId: undefined }
              : m,
          ),
        );
        onChatCreated(newChatId);
      } else {
        const saved = await sendMessageAction({ chatId: activeChatId, postId, content });
        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId ? { ...m, id: saved.id, tempId: undefined } : m,
          ),
        );
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      onError(e instanceof Error ? e.message : "메시지를 보낼 수 없습니다.");
    }
  };

  return { input, setInput, handleSend };
}
