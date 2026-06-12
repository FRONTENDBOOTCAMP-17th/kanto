import type { ElementType } from "react";
import { Heart, FileText, MessageCircle } from "lucide-react";
import type { Notification } from "@/hooks/useNotifications";

const ICON_MAP: Record<string, { icon: ElementType; color: string }> = {
  like: { icon: Heart, color: "text-red-400" },
  comment: { icon: FileText, color: "text-blue-400" },
  chat: { icon: MessageCircle, color: "text-teal-400" },
};

interface Props {
  notification: Notification;
  onClick: (n: Notification) => void;
}

export function NotificationItem({ notification: n, onClick }: Props) {
  const meta = ICON_MAP[n.type ?? "like"] ?? ICON_MAP.like;
  const Icon = meta.icon;

  return (
    <button
      onClick={() => onClick(n)}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
        !n.is_read ? "bg-teal-50/40" : ""
      }`}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700">{n.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>
        <p className="text-xs text-gray-400 mt-0.5">{n.created_at}</p>
      </div>
      {!n.is_read && (
        <span className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 shrink-0" />
      )}
    </button>
  );
}
