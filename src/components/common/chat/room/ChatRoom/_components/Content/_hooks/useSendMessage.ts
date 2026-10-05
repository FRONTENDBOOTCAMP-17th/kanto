import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import {
  createChatAndSendAction,
  findSavedMessageAction,
  sendMessageAction,
} from "../../../../actions";
import { trackSend } from "@/utils/chat/trackSend";
import type { MessageSendStatus, MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";

/** 서버 저장 확인 시 시계 오차를 감안해 전송 시작보다 이전부터 조회하는 여유 시간 */
const SAVED_LOOKUP_MARGIN_MS = 30000;

interface Params {
  activeChatId: number | null;
  postId: number;
  partner: SellerInfo;
  currentUser: SellerInfo;
  messages: MessageWithSender[];
  setMessages: Dispatch<SetStateAction<MessageWithSender[]>>;
  recordSend: () => boolean;
  onChatCreated: (newChatId: number) => void;
  onError: (message: string) => void;
}

interface Saved {
  id: number;
  chatId?: number;
}

/**
 * 전송 시 낙관적 업데이트 후 신규/기존 채팅방에 메시지를 보낸다.
 * 1초가 넘으면 "전송 중", 실패하면 "전송 실패"로 표시하고 재전송·삭제를 제공한다.
 */
export function useSendMessage(params: Params) {
  const { setMessages } = params;

  // 콜백을 안정적으로 유지하기 위해 최신 값은 ref로 읽는다 (MessageItem memo 보호)
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
      const { activeChatId, postId, partner, currentUser, onChatCreated, onError } = latest.current;
      const since = new Date(tempId - SAVED_LOOKUP_MARGIN_MS).toISOString();

      trackSend<Saved>({
        checkFirst,
        send: async () => {
          if (activeChatId === null) {
            const { chatId, message } = await createChatAndSendAction({
              partnerUserId: partner.id,
              postId,
              content,
            });
            return { id: message.id, chatId };
          }
          const saved = await sendMessageAction({ chatId: activeChatId, postId, content });
          return { id: saved.id };
        },
        findSaved: async () => {
          if (activeChatId === null) return null;
          const excludeIds = latest.current.messages
            .filter(
              (m) => m.sender_id === currentUser.id && m.content === content && m.id !== m.tempId,
            )
            .map((m) => m.id);
          return findSavedMessageAction({ chatId: activeChatId, content, since, excludeIds });
        },
        onSlow: () => setStatus(tempId, "sending"),
        onSaved: (saved) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.tempId === tempId
                ? { ...m, id: saved.id, chat_id: saved.chatId ?? m.chat_id, status: undefined }
                : m,
            ),
          );
          if (saved.chatId !== undefined) onChatCreated(saved.chatId);
        },
        onFailed: (error) => {
          setStatus(tempId, "failed");
          if (error !== undefined) {
            onError(error instanceof Error ? error.message : "메시지를 보낼 수 없습니다.");
          }
        },
      });
    },
    [setMessages, setStatus],
  );

  const handleSend = useCallback(
    (content: string) => {
      const { activeChatId, postId, currentUser, recordSend } = latest.current;
      if (recordSend()) return;

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
      runSend(tempId, content, false);
    },
    [setMessages, runSend],
  );

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

  return { handleSend, retryMessage, deleteMessage };
}
