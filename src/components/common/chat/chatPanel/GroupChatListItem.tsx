import { useLocale } from "next-intl";
import { TOPIC_META } from "@/constants/meetupTopics";
import { formatChatListTime } from "@/utils/formatTime";
import type { Locale } from "@/i18n/config";
import type { MyGroupRoom } from "@/type/groupChat";

interface Props {
  room: MyGroupRoom;
  isLast: boolean;
  onClick: () => void;
}

export default function GroupChatListItem({ room, isLast, onClick }: Props) {
  const locale = useLocale() as Locale;
  const meta = TOPIC_META[room.topic] ?? TOPIC_META.other;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 md:gap-2.5 md:px-3 md:py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      <div
        className="w-11 h-11 md:w-9 md:h-9 rounded-full flex items-center justify-center font-semibold text-base md:text-sm shrink-0"
        style={{ background: meta.bg, color: meta.color }}
      >
        {meta.label[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-gray-900 text-sm md:text-xs truncate">
              {room.title}
            </span>
            {room.status === "ended" && (
              <span className="text-xs md:text-[10px] text-gray-400 shrink-0">종료됨</span>
            )}
          </div>
          <span className="text-xs md:text-[10px] text-gray-400 shrink-0">
            {formatChatListTime(room.last_message_at, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p
            className={`text-sm md:text-xs truncate ${
              room.unread_count > 0 ? "font-medium text-gray-700" : "text-gray-400"
            }`}
          >
            {room.last_message_content ?? "아직 메시지가 없습니다"}
          </p>
          {room.unread_count > 0 && (
            <span className="w-5 h-5 md:w-4 md:h-4 rounded-full bg-teal-500 text-white text-xs md:text-[10px] flex items-center justify-center font-medium shrink-0">
              {room.unread_count > 9 ? "9+" : room.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
