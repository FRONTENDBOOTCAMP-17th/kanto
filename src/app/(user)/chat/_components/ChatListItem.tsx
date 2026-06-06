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

export default function ChatListItem({ chat, currentUserId, isLast, onClick }: Props) {
  const otherUser = chat.user_id_1 === currentUserId ? chat.user2 : chat.user1;
  const lastMessage = chat.last_message_content;
  const unreadCount = chat.messages?.filter((m) => !m.is_read).length ?? 0;
  const category = categoryLabel[chat.posts?.post_type ?? ""] ?? chat.posts?.post_type ?? "";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
        {otherUser?.name?.[0] ?? "?"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-gray-900 text-sm">
            {otherUser?.name ?? "알 수 없음"}
          </span>
          {category && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryStyle[category] ?? "bg-gray-100 text-gray-500"}`}>
              {category}
            </span>
          )}
        </div>
        <p className={`text-sm truncate ${unreadCount > 0 ? "font-medium text-teal-600" : "text-gray-400"}`}>
          {lastMessage ?? "메시지가 없습니다"}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-xs text-gray-400">
          {formatChatListTime(chat.last_message_at)}
        </span>
        {unreadCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}
