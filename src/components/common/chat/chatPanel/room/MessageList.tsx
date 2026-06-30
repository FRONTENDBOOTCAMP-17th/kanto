import { Fragment, useEffect, useState, type RefObject } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import type { Transaction } from "@/type/transaction";
import { formatDateDivider, formatMessageTime } from "@/utils/format";
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
  partnerOnline: boolean;
}

function UnreadMark({ partnerOnline }: { partnerOnline: boolean }) {
  const [visible, setVisible] = useState(!partnerOnline);
  useEffect(() => {
    const delay = partnerOnline ? 1000 : 0;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [partnerOnline]);
  if (!visible) return null;
  return <span className="text-xs md:text-[10px] text-teal-500 font-medium">1</span>;
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
  const locale = useLocale() as Locale;
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
        const isMine = msg.sender_id === currentUser.id;
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
            {msg.type === "system" ? (
              <div className="flex justify-center my-1">
                <span className="rounded-full bg-gray-200/70 px-3 py-1 text-center text-xs md:text-[11px] text-gray-500 break-keep">
                  {msg.content}
                </span>
              </div>
            ) : (
            <div className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
              <div className={`flex items-end gap-1 ${isMine ? "flex-row-reverse" : ""}`}>
                {msg.type === "payment" && msg.transaction ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <PaymentCard
                      transaction={msg.transaction}
                      currentUser={currentUser}
                      onTransactionChange={onTransactionChange}
                    />
                    {(() => {
                      const tx = msg.transaction;
                      const timedOut =
                        tx.status === "pending" &&
                        Date.now() - new Date(tx.created_at).getTime() > 24 * 60 * 60 * 1000;
                      if (timedOut || tx.status === "expired") {
                        return (
                          <span className="rounded-full bg-gray-200/70 px-3 py-1 text-center text-xs md:text-[11px] text-gray-500 break-keep">
                            {t("payment.expiredNotice")}
                          </span>
                        );
                      }
                      if (tx.status === "pending") {
                        return (
                          <span className="rounded-full bg-gray-200/70 px-3 py-1 text-center text-xs md:text-[11px] text-gray-500 break-keep">
                            {t("payment.pendingNotice")}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
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
                <div className={`flex flex-col shrink-0 ${isMine ? "items-end" : "items-start"} ${showMeta ? "" : "invisible"}`}>
                  {isMine && !msg.is_read && <UnreadMark partnerOnline={partnerOnline} />}
                  <time dateTime={msg.created_at} className="text-xs md:text-[10px] text-gray-400">
                    {formatMessageTime(msg.created_at, locale)}
                  </time>
                </div>
              </div>
            </div>
            )}
          </Fragment>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
