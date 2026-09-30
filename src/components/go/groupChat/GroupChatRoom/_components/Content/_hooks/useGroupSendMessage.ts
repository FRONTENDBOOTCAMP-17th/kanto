import { useState, type Dispatch, type SetStateAction } from "react";
import { postGroupMessage } from "@/services/go/groupChat";
import type { GroupMessageWithSender } from "@/type/groupChat";
import type { SellerInfo } from "@/type/user";

interface Params {
  roomId: number;
  currentUser: SellerInfo;
  setMessages: Dispatch<SetStateAction<GroupMessageWithSender[]>>;
  recordSend: () => boolean;
  onSent: () => void;
  onError: () => void;
}

/** 입력값을 관리하고, 전송 시 낙관적 업데이트 후 그룹 채팅방에 메시지를 보낸다. */
export function useGroupSendMessage({
  roomId,
  currentUser,
  setMessages,
  recordSend,
  onSent,
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
    const optimistic: GroupMessageWithSender = {
      id: tempId,
      room_id: roomId,
      sender_id: currentUser.id,
      content,
      type: "text",
      created_at: new Date().toISOString(),
      sender: currentUser,
      tempId,
    };
    setMessages((prev) => [...prev, optimistic]);
    onSent();

    try {
      const saved = await postGroupMessage(roomId, content);
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...saved, tempId: undefined } : m)),
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      onError();
    }
  };

  return { input, setInput, handleSend };
}
