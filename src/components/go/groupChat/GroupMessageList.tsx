"use client";

import { type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMessageTime } from "@/utils/format";
import type { Locale } from "@/i18n/config";
import type { GroupMessageWithSender } from "@/type/groupChat";
import FailedMessageActions, {
  FailedMessageBadge,
} from "@/components/common/chat/room/FailedMessageActions";
import type { SellerInfo } from "@/type/user";

interface Props {
  messages: GroupMessageWithSender[];
  currentUser: SellerInfo;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onNearBottomChange: (nearBottom: boolean) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onRetry: (tempId: number) => void;
  onDelete: (tempId: number) => void;
}

export default function GroupMessageList({
  messages: allMessages,
  currentUser,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onNearBottomChange,
  messagesEndRef,
  scrollContainerRef,
  onRetry,
  onDelete,
}: Props) {
  const t = useTranslations("Go.chat");
  const locale = useLocale() as Locale;
  // 전송 실패한 메시지는 항상 맨 아래에 고정해 사용자가 놓치지 않도록 한다.
  const messages = [
    ...allMessages.filter((m) => m.status !== "failed"),
    ...allMessages.filter((m) => m.status === "failed"),
  ];

  const minuteKey = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setSeconds(0, 0);
    return date.getTime();
  };

  return (
    <div
      ref={scrollContainerRef}
      data-chat-scroll
      onScroll={(e) => {
        const el = e.currentTarget;
        onNearBottomChange(
          el.scrollHeight - el.scrollTop - el.clientHeight < 80,
        );
      }}
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-2"
    >
      {hasMore && (
        <div className="flex justify-center mb-1">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-3 py-1 text-xs text-teal-600 bg-teal-50 rounded-full border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? t("loadingMore") : t("loadMore")}
          </button>
        </div>
      )}

      {messages.map((msg, index) => {
        const isMine = msg.sender_id === currentUser.id;
        const prev = messages[index - 1];
        const next = messages[index + 1];
        const showSenderName =
          !isMine &&
          (!prev || prev.type === "system" || prev.sender_id !== msg.sender_id);
        const showTime =
          !next ||
          next.type === "system" ||
          next.sender_id !== msg.sender_id ||
          minuteKey(next.created_at) !== minuteKey(msg.created_at);

        if (msg.type === "system") {
          return (
            <div key={msg.id} className="flex justify-center my-1">
              <span className="rounded-full bg-gray-200/70 px-3 py-1 text-center text-xs text-gray-500 break-keep">
                {msg.content}
              </span>
            </div>
          );
        }

        const tempId = msg.tempId;
        const isSending = isMine && msg.status === "sending";
        const isFailed = isMine && msg.status === "failed" && tempId !== undefined;

        return (
          <div
            key={msg.id}
            data-group-message-id={msg.id}
            className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}
          >
            {showSenderName && (
              <span className="text-xs text-gray-500 ml-1">
                {msg.sender.name}
              </span>
            )}
            <div
              className={`flex items-end gap-1 ${isMine ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`max-w-65 px-3 py-2 rounded-2xl text-sm leading-relaxed break-keep ${
                  isMine
                    ? "bg-teal-500 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
                } ${isSending || isFailed ? "opacity-60" : ""}`}
              >
                {msg.content}
              </div>
              {isFailed && (
                <>
                  <FailedMessageBadge
                    failedLabel={t("messageFailed")}
                    retryLabel={t("messageRetry")}
                    deleteLabel={t("messageDelete")}
                    onRetry={() => onRetry(tempId)}
                    onDelete={() => onDelete(tempId)}
                  />
                  <FailedMessageActions
                    failedLabel={t("messageFailed")}
                    retryLabel={t("messageRetry")}
                    deleteLabel={t("messageDelete")}
                    onRetry={() => onRetry(tempId)}
                    onDelete={() => onDelete(tempId)}
                    textClassName="text-[11px]"
                  />
                </>
              )}
              {isSending && (
                <span className="flex min-h-10 items-end px-1 md:min-h-0 md:px-0">
                  <span className="flex items-center gap-1 text-[11px] leading-none text-gray-400">
                    {t("messageSending")}
                    <span className="size-4 animate-spin motion-reduce:animate-none rounded-full border-2 border-gray-300 border-t-teal-500" />
                  </span>
                </span>
              )}
              <time
                dateTime={msg.created_at}
                className={`shrink-0 text-xs text-gray-400 ${showTime || isFailed || isSending ? "" : "invisible"} ${isFailed || isSending ? "hidden" : ""}`}
              >
                {formatMessageTime(msg.created_at, locale)}
              </time>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
