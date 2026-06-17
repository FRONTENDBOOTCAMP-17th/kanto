import { Fragment, type RefObject } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import type { Transaction } from "@/type/transaction";
import { formatDateDivider, formatMessageTime } from "@/utils/formatTime";
import type { Locale } from "@/i18n/config";
import PaymentCard from "./PaymentCard";

interface Props {
  messages: MessageWithSender[];
  currentUser: SellerInfo;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onTransactionChange: (transaction: Transaction) => void;
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
}: Props) {
  const t = useTranslations("Chat");
  const locale = useLocale() as Locale;
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-h-0 overflow-y-auto px-4 py-4 md:px-3 md:py-3 flex flex-col gap-2"
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
        const isMine = msg.sender_id === currentUser.id;
        const msgDate = new Date(msg.created_at).toDateString();
        const prevDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
        const showDivider = msgDate !== prevDate;

        return (
          <Fragment key={msg.id}>
            {showDivider && (
              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px bg-gray-200" />
                <time dateTime={msg.created_at} className="text-xs md:text-[10px] text-gray-400">
                  {formatDateDivider(msg.created_at, locale)}
                </time>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}
            <div className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
              <div className={`flex items-end gap-1 ${isMine ? "flex-row-reverse" : ""}`}>
                {msg.type === "payment" && msg.transaction ? (
                  <PaymentCard
                    transaction={msg.transaction}
                    currentUser={currentUser}
                    onTransactionChange={onTransactionChange}
                  />
                ) : (
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm md:text-xs leading-relaxed break-keep ${
                      isMine
                        ? "bg-teal-500 text-white rounded-tr-sm"
                        : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
                <div className={`flex flex-col shrink-0 ${isMine ? "items-end" : "items-start"}`}>
                  {isMine && !msg.is_read && (
                    <span className="text-xs md:text-[10px] text-teal-500 font-medium">1</span>
                  )}
                  <time dateTime={msg.created_at} className="text-xs md:text-[10px] text-gray-400">
                    {formatMessageTime(msg.created_at, locale)}
                  </time>
                </div>
              </div>
            </div>
          </Fragment>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
