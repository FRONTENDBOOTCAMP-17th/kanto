import type { RefObject } from "react";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import { formatMessageTime } from "@/utils/formatTime";

interface Props {
  messages: MessageWithSender[];
  currentUser: SellerInfo;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

export default function MessageList({
  messages,
  currentUser,
  hasMore,
  isLoadingMore,
  onLoadMore,
  messagesEndRef,
  scrollContainerRef,
}: Props) {
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4"
    >
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="cursor-pointer px-4 py-1.5 text-xs text-teal-600 bg-teal-50 rounded-full border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? "불러오는 중..." : "이전 메시지 보기"}
          </button>
        </div>
      )}

      {messages.map((msg) => {
        const isMine = msg.sender_id === currentUser.id;
        return (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}
          >
            <div
              className={`flex items-end gap-1 ${isMine ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-keep ${
                  isMine
                    ? "bg-teal-500 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.content}
              </div>
              <div
                className={`flex flex-col shrink-0 ${isMine ? "items-end" : "items-start"}`}
              >
                {isMine && !msg.is_read && (
                  <span className="text-xs text-teal-500 font-medium">1</span>
                )}
                <span className="text-xs text-gray-400">
                  {formatMessageTime(msg.created_at)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
