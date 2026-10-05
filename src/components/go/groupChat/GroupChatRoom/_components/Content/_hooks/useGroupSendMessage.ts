import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { findSavedGroupMessage, postGroupMessage } from "@/services/go/groupChat";
import { trackSend } from "@/utils/chat/trackSend";
import type { MessageSendStatus } from "@/type/chat/message";
import type { GroupMessageWithSender } from "@/type/groupChat";
import type { SellerInfo } from "@/type/user";

/** 서버 저장 확인 시 시계 오차를 감안해 전송 시작보다 이전부터 조회하는 여유 시간 */
const SAVED_LOOKUP_MARGIN_MS = 30000;

interface Params {
  roomId: number;
  currentUser: SellerInfo;
  messages: GroupMessageWithSender[];
  setMessages: Dispatch<SetStateAction<GroupMessageWithSender[]>>;
  recordSend: () => boolean;
  onSent: () => void;
  onError: () => void;
}

interface Saved {
  id: number;
  created_at: string;
}

/**
 * 입력값을 관리하고, 전송 시 낙관적 업데이트 후 그룹 채팅방에 메시지를 보낸다.
 * 1초가 넘으면 "전송 중", 실패하면 "전송 실패"로 표시하고 재전송·삭제를 제공한다.
 */
export function useGroupSendMessage(params: Params) {
  const { setMessages } = params;
  const [input, setInput] = useState("");

  const latest = useRef(params);
  useEffect(() => {
    latest.current = params;
  });

  const setStatus = useCallback(
    (tempId: number, status?: MessageSendStatus) =>
      setMessages((prev) => prev.map((m) => (m.tempId === tempId ? { ...m, status } : m))),
    [setMessages],
  );

  const runSend = useCallback(
    (tempId: number, content: string, checkFirst: boolean) => {
      const { roomId, currentUser, onError } = latest.current;
      const since = new Date(tempId - SAVED_LOOKUP_MARGIN_MS).toISOString();

      trackSend<Saved>({
        checkFirst,
        send: async () => {
          const saved = await postGroupMessage(roomId, content);
          return { id: saved.id, created_at: saved.created_at };
        },
        findSaved: () => {
          const excludeIds = latest.current.messages
            .filter(
              (m) => m.sender_id === currentUser.id && m.content === content && m.id !== m.tempId,
            )
            .map((m) => m.id);
          return findSavedGroupMessage(roomId, content, since, excludeIds);
        },
        onSlow: () => setStatus(tempId, "sending"),
        onSaved: (saved) =>
          setMessages((prev) =>
            prev.map((m) =>
              m.tempId === tempId
                ? { ...m, ...saved, tempId: undefined, status: undefined }
                : m,
            ),
          ),
        onFailed: (error) => {
          setStatus(tempId, "failed");
          if (error !== undefined) onError();
        },
      });
    },
    [setMessages, setStatus],
  );

  const handleSend = () => {
    if (!input.trim()) return;
    const { currentUser, roomId, recordSend, onSent } = latest.current;
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
    runSend(tempId, content, false);
  };

  const retryMessage = useCallback(
    (tempId: number) => {
      const target = latest.current.messages.find((m) => m.tempId === tempId);
      if (!target) return;
      setStatus(tempId, "sending");
      runSend(tempId, target.content, true);
    },
    [setStatus, runSend],
  );

  const deleteMessage = useCallback(
    (tempId: number) => setMessages((prev) => prev.filter((m) => m.tempId !== tempId)),
    [setMessages],
  );

  return { input, setInput, handleSend, retryMessage, deleteMessage };
}
