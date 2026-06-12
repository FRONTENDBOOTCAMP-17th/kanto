import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "@/hooks/useNotifications";

interface Props {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (n: Notification) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAllRead,
  onClose,
}: Props) {
  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-800 text-sm">알림</span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-teal-500 hover:text-teal-600"
            >
              모두 읽음
            </button>
          )}
          <Link
            href={ROUTES.notifications}
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            전체보기
          </Link>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            알림이 없습니다
          </p>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={onNotificationClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
