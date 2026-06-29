"use client";

import { type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMessageTime } from "@/utils/format";
import type { Locale } from "@/i18n/config";
import type { GroupMessageWithSender } from "@/type/groupChat";
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
}

export default function GroupMessageList({
  messages,
  currentUser,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onNearBottomChange,
  messagesEndRef,
  scrollContainerRef,
}: Props) {
  const t = useTranslations("Go.chat");
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
                }`}
              >
                {msg.content}
              </div>
              <time
                dateTime={msg.created_at}
                className={`shrink-0 text-xs text-gray-400 ${showTime ? "" : "invisible"}`}
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
