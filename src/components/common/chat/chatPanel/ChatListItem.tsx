import { useTranslations, useLocale } from "next-intl";
import type { ChatWithUsers } from "@/type/chat/chat";
import { formatChatListTime } from "@/utils/formatTime";
import type { Locale } from "@/i18n/config";

const categoryStyle: Record<string, string> = {
  used_goods: "bg-teal-50 text-teal-600",
  rental: "bg-cyan-50 text-cyan-600",
  jobs: "bg-green-50 text-green-600",
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
  const t = useTranslations("Chat");
  const locale = useLocale() as Locale;
  const otherUser = chat.user_id_1 === currentUserId ? chat.user2 : chat.user1;
  const lastMessage = chat.last_message_content;
  const unreadCount =
    currentUserId === chat.user_id_1
      ? (chat.user_id_1_unread ?? 0)
      : (chat.user_id_2_unread ?? 0);
  const postType = chat.posts?.post_type ?? "";
  const hasCategory = postType in categoryStyle;

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
              {otherUser?.name ?? t("unknownUser")}
            </span>
            {hasCategory && (
              <span className={`text-xs md:text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${categoryStyle[postType]}`}>
                {t(`category.${postType}`)}
              </span>
            )}
          </div>
          <span className="text-xs md:text-[10px] text-gray-400 shrink-0">
            {formatChatListTime(chat.last_message_at, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm md:text-xs truncate ${unreadCount > 0 ? "font-medium text-gray-700" : "text-gray-400"}`}>
            {lastMessage ?? t("noMessage")}
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
