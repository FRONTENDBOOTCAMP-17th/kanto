"use client";

import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { getNotificationHref } from "@/utils/notification";
import { NotificationDropdown } from "@/components/common/header/NotificationDropdown";
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
    <NotificationDropdown
      variant="page"
      notifications={notifications}
      unreadCount={unreadCount}
      onNotificationClick={handleClick}
      onMarkAllRead={markAllRead}
      onClose={() => router.back()}
    />
  );
}
