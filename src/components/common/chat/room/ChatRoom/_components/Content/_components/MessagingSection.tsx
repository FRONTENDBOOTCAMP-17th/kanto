"use client";

import { Profiler, useCallback } from "react";
import type {
  Dispatch,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
import type { MessageWithSender } from "@/type/chat/message";
import type { Transaction } from "@/type/transaction";
import type { SellerInfo } from "@/type/user";
import { useSpamConfig } from "@/hooks/useSpamConfig";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import { useChatRoomRealtime } from "../_hooks/useChatRoomRealtime";
import { useSendMessage } from "../_hooks/useSendMessage";
import MessageList from "../../../../MessageList";
import ChatInput from "../../../../ChatInput";

interface Props {
  activeChatId: number | null;
  postId: number;
  partner: SellerInfo;
  currentUser: SellerInfo;
  messages: MessageWithSender[];
  setMessages: Dispatch<SetStateAction<MessageWithSender[]>>;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  blocked: boolean;
  onChatCreated: (newChatId: number) => void;
  onError: (message: string) => void;
  /** MessageList와 ChatInput 사이(배너·결제버튼 자리)에 그대로 끼워 넣는다. */
  children?: ReactNode;
}

/** 메시지 목록·실시간 수신·스팸 방지·전송 입력창을 조립한다. */
export default function MessagingSection({
  activeChatId,
  postId,
  partner,
  currentUser,
  messages,
  setMessages,
  hasMore,
  isLoadingMore,
  loadMore,
  messagesEndRef,
  scrollContainerRef,
  blocked,
  onChatCreated,
  onError,
  children,
}: Props) {
  const spamConfig = useSpamConfig();
  const { isCooldown, cooldownSeconds, recordSend } = useSpamPrevention({
    windowMs: spamConfig.chat_window_sec * 1000,
    maxCount: spamConfig.chat_max_count,
    cooldownSec: spamConfig.chat_cooldown_sec,
  });

  const { partnerOnline } = useChatRoomRealtime({
    chatId: activeChatId,
    currentUser,
    partner,
    setMessages,
  });

  const { handleSend } = useSendMessage({
    activeChatId,
    postId,
    partner,
    currentUser,
    setMessages,
    recordSend,
    onChatCreated,
    onError,
  });

  const handleTransactionChange = useCallback(
    (transaction: Transaction) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.transaction_id === transaction.id ? { ...m, transaction } : m,
        ),
      );
    },
    [setMessages],
  );

  return (
    <>
      {/* [측정용 임시 코드] MessageList 전체 렌더 시간 기록 */}
      <Profiler
        id="MessageList"
        onRender={(id, phase, actualDuration) => {
          type Row = { phase: string; actualDuration: number; content?: string; messages?: number };
          const w = window as unknown as { __chatRenders?: Row[]; __itemRenders?: Row[]; __summaryTimer?: number };
          (w.__chatRenders ??= []).push({ phase, actualDuration, messages: messages.length });
          // 마지막 렌더 후 1.5초간 추가 렌더가 없으면 요약을 콘솔에 출력하고 기록을 비운다
          clearTimeout(w.__summaryTimer);
          w.__summaryTimer = window.setTimeout(() => {
            const list = w.__chatRenders ?? [];
            const items = w.__itemRenders ?? [];
            const ms = list.reduce((s, x) => s + x.actualDuration, 0);
            console.log(
              `[측정] 메시지 ${messages.length}개 | MessageList 렌더 ${list.length}회 (${ms.toFixed(1)}ms) | 렌더된 말풍선 ${items.length}개 | mount ${items.filter((x) => x.phase === "mount").length}개`,
            );
            console.table(items.map((x) => ({ phase: x.phase, content: x.content, ms: +x.actualDuration.toFixed(2) })));
            w.__chatRenders = [];
            w.__itemRenders = [];
          }, 1500);
        }}
      >
      <MessageList
        messages={messages}
        currentUser={currentUser}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        messagesEndRef={messagesEndRef}
        scrollContainerRef={scrollContainerRef}
        onTransactionChange={handleTransactionChange}
        partnerOnline={partnerOnline}
      />
      </Profiler>
      {children}
      <ChatInput
        onSend={handleSend}
        isCooldown={isCooldown}
        cooldownSeconds={cooldownSeconds}
        blocked={blocked}
      />
    </>
  );
}
