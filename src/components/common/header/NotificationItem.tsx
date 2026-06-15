import type { ElementType } from "react";
import { Heart, FileText, MessageCircle, Bird } from "lucide-react";
import type { Notification } from "@/hooks/useNotifications";
import { formatTimeAgo } from "@/utils/formatTime";

const ICON_MAP: Record<string, { icon: ElementType; color: string }> = {
  like:     { icon: Heart,         color: "text-red-400" },
  comment:  { icon: FileText,      color: "text-blue-400" },
  chat:     { icon: MessageCircle, color: "text-teal-400" },
  new_post: { icon: Bird,          color: "text-orange-400" },
};

interface Props {
  notification: Notification;
  onClick: (n: Notification) => void;
  size?: "sm" | "lg";
}

export function NotificationItem({ notification: n, onClick, size = "sm" }: Props) {
  const meta = ICON_MAP[n.type ?? "like"] ?? ICON_MAP.like;
  const Icon = meta.icon;
  const lg = size === "lg";

  return (
    <button
      onClick={() => onClick(n)}
      className={`w-full text-left flex items-start gap-3 hover:bg-gray-50 transition-colors ${
        lg ? "px-5 py-4" : "px-4 py-3"
      } ${!n.is_read ? "bg-teal-50/40" : ""}`}
    >
      <Icon className={`shrink-0 mt-0.5 ${lg ? "w-5 h-5" : "w-4 h-4"} ${meta.color}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-gray-700 ${lg ? "text-sm" : "text-xs"}`}>{n.title}</p>
        <p className={`text-gray-500 mt-0.5 truncate ${lg ? "text-sm" : "text-xs"}`}>{n.body}</p>
        {n.created_at && (
          <time dateTime={n.created_at} className={`text-gray-400 mt-0.5 ${lg ? "text-xs" : "text-xs"}`}>
            {formatTimeAgo(n.created_at)}
          </time>
        )}
      </div>
      {!n.is_read && (
        <span className={`bg-teal-500 rounded-full shrink-0 ${lg ? "w-2.5 h-2.5 mt-2" : "w-2 h-2 mt-1.5"}`} />
      )}
    </button>
  );
}
