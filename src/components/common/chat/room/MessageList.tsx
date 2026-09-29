import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import type { Transaction } from "@/type/transaction";
import MessageItem from "./MessageItem";

interface Props {
  messages: MessageWithSender[];
  currentUser: SellerInfo;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onTransactionChange: (transaction: Transaction) => void;
  partnerOnline: boolean;
}

export default function MessageList({
  messages,
  currentUser,
  hasMore,
  isLoadingMore,
  onLoadMore,
  messagesEndRef,
  scrollContainerRef,
  onTransactionChange,
  partnerOnline,
}: Props) {
  const t = useTranslations("Chat");
  const minuteKey = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setSeconds(0, 0);
    return date.getTime();
  };

  return (
    <div
      ref={scrollContainerRef}
      data-chat-scroll
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 md:px-3 md:py-3 flex flex-col gap-2"
    >
      {hasMore && (
        <div className="flex justify-center mb-1">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="cursor-pointer px-3 py-1 text-xs text-teal-600 bg-teal-50 rounded-full border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? t("loadingMore") : t("loadPrevious")}
          </button>
        </div>
      )}

      {messages.map((msg, index) => {
        const msgDate = new Date(msg.created_at).toDateString();
        const prevDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
        const showDivider = msgDate !== prevDate;
        const next = messages[index + 1];
        const showMeta =
          !next ||
          next.type === "system" ||
          next.sender_id !== msg.sender_id ||
          minuteKey(next.created_at) !== minuteKey(msg.created_at);

        return (
          // 전송 직후 임시 id → 실제 id로 바뀌어도 재마운트되지 않도록 tempId를 우선 key로 사용
          <MessageItem
            key={msg.tempId ?? msg.id}
            msg={msg}
            currentUser={currentUser}
            showDivider={showDivider}
            showMeta={showMeta}
            partnerOnline={partnerOnline}
            onTransactionChange={onTransactionChange}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
