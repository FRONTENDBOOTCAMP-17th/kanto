"use client";

import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { getNotificationHref } from "@/utils/notification";
import { NotificationItem } from "@/components/common/header/NotificationItem";
import type { Notification } from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllRead } =
    useNotifications();

  const handleClick = async (n: Notification) => {
    await markAsRead(n);
    const href = getNotificationHref(n);
    if (href) router.push(href);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-semibold text-gray-800 text-sm">알림</span>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-teal-500 hover:text-teal-600"
          >
            모두 읽음
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            알림이 없습니다
          </p>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={handleClick} size="lg" />
          ))
        )}
      </div>
    </div>
  );
}
