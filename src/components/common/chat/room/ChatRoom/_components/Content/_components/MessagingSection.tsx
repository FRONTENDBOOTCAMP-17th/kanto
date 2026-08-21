"use client";

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

  const { input, setInput, handleSend } = useSendMessage({
    activeChatId,
    postId,
    partner,
    currentUser,
    setMessages,
    recordSend,
    onChatCreated,
    onError,
  });

  const handleTransactionChange = (transaction: Transaction) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.transaction_id === transaction.id ? { ...m, transaction } : m,
      ),
    );
  };

  return (
    <>
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
      {children}
      <ChatInput
        input={input}
        onChange={setInput}
        onSend={handleSend}
        isCooldown={isCooldown}
        cooldownSeconds={cooldownSeconds}
        blocked={blocked}
      />
    </>
  );
}
