import type { ChatWithUsers } from "@/type/chat/chat";
import { formatChatListTime } from "@/utils/formatTime";

const categoryLabel: Record<string, string> = {
  used_goods: "중고거래",
  room_rent: "방렌트",
  job: "구인구직",
};

const categoryStyle: Record<string, string> = {
  중고거래: "bg-teal-50 text-teal-600",
  방렌트: "bg-cyan-50 text-cyan-600",
  구인구직: "bg-green-50 text-green-600",
};

interface Props {
  chat: ChatWithUsers;
  currentUserId: number;
  isLast: boolean;
  onClick: () => void;
}

export default function ChatListItem({
  chat,
  currentUserId,
  isLast,
  onClick,
}: Props) {
  const otherUser = chat.user_id_1 === currentUserId ? chat.user2 : chat.user1;
  const lastMessage = chat.last_message_content;
  const unreadCount =
    currentUserId === chat.user_id_1
      ? (chat.user_id_1_unread ?? 0)
      : (chat.user_id_2_unread ?? 0);
  const category =
    categoryLabel[chat.posts?.post_type ?? ""] ?? chat.posts?.post_type ?? "";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 md:gap-2.5 md:px-3 md:py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      {/* 아바타 */}
      <div className="w-11 h-11 md:w-9 md:h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-base md:text-sm shrink-0">
        {otherUser?.name?.[0] ?? "?"}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-gray-900 text-sm md:text-xs truncate">
              {otherUser?.name ?? "알 수 없음"}
            </span>
            {category && (
              <span className={`text-xs md:text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${categoryStyle[category] ?? "bg-gray-100 text-gray-500"}`}>
                {category}
              </span>
            )}
          </div>
          <span className="text-xs md:text-[10px] text-gray-400 shrink-0">
            {formatChatListTime(chat.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm md:text-xs truncate ${unreadCount > 0 ? "font-medium text-gray-700" : "text-gray-400"}`}>
            {lastMessage ?? "메시지가 없습니다"}
          </p>
          {unreadCount > 0 && (
            <span className="w-5 h-5 md:w-4 md:h-4 rounded-full bg-teal-500 text-white text-xs md:text-[10px] flex items-center justify-center font-medium shrink-0">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
