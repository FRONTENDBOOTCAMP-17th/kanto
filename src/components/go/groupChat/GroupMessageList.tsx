"use client";

import { Fragment, useState, type RefObject } from "react";
import { MoreVertical } from "lucide-react";
import type { GroupMessageWithSender } from "@/type/groupChat";
import type { SellerInfo } from "@/type/user";
import MessageActionMenu from "./MessageActionMenu";

interface Props {
  messages: GroupMessageWithSender[];
  currentUser: SellerInfo;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  onReport: (message: GroupMessageWithSender) => void;
  onBlockUser: (userId: number) => void;
}

export default function GroupMessageList({
  messages,
  currentUser,
  hasMore,
  isLoadingMore,
  onLoadMore,
  messagesEndRef,
  scrollContainerRef,
  onReport,
  onBlockUser,
}: Props) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 flex flex-col gap-2"
    >
      {hasMore && (
        <div className="flex justify-center mb-1">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-3 py-1 text-xs text-teal-600 bg-teal-50 rounded-full border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? "불러오는 중..." : "이전 메시지 더보기"}
          </button>
        </div>
      )}

      {messages.map((msg) => {
        const isMine = msg.sender_id === currentUser.id;

        if (msg.type === "system") {
          return (
            <Fragment key={msg.id}>
              <div className="flex justify-center my-1">
                <span className="rounded-full bg-gray-200/70 px-3 py-1 text-center text-xs text-gray-500 break-keep">
                  {msg.content}
                </span>
              </div>
            </Fragment>
          );
        }

        return (
          <div key={msg.id} className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
            {!isMine && (
              <span className="text-xs text-gray-500 ml-1">{msg.sender.name}</span>
            )}
            <div className={`flex items-end gap-1 relative ${isMine ? "flex-row-reverse" : ""}`}>
              <div
                className={`max-w-[260px] px-3 py-2 rounded-2xl text-sm leading-relaxed break-keep ${
                  isMine
                    ? "bg-teal-500 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.content}
              </div>
              {!isMine && (
                <button
                  onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                  aria-label="메시지 메뉴"
                  className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
              {openMenuId === msg.id && (
                <div className="absolute left-0 top-full">
                  <MessageActionMenu
                    onReport={() => onReport(msg)}
                    onBlockUser={() => onBlockUser(msg.sender_id)}
                    onClose={() => setOpenMenuId(null)}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
