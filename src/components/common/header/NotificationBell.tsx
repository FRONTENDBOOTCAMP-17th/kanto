"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useNotifications } from "@/hooks/useNotifications";
import { getNotificationHref } from "@/utils/notification";
import { NotificationDropdown } from "./NotificationDropdown";
import type { Notification } from "@/hooks/useNotifications";

interface Props {
  onOpen?: () => void;
}

export interface NotificationBellHandle {
  close: () => void;
}

export const NotificationBell = forwardRef<NotificationBellHandle, Props>(
  ({ onOpen }, ref) => {
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllRead } =
      useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({ close: () => setIsOpen(false) }));

    useEffect(() => {
      const onClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        )
          setIsOpen(false);
      };
      if (isOpen) document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }, [isOpen]);

    const handleToggle = () => {
      if (window.innerWidth < 768) {
        router.push(ROUTES.notifications);
        return;
      }
      setIsOpen((v) => {
        if (!v) onOpen?.();
        return !v;
      });
    };

    const handleNotificationClick = async (n: Notification) => {
      await markAsRead(n);
      setIsOpen(false);
      const href = getNotificationHref(n);
      if (href) router.push(href);
    };

    const Badge = unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full flex items-center justify-center text-[7px] text-white font-bold">
        {unreadCount}
      </span>
    );

    return (
      <div className="relative flex" ref={containerRef}>
        <button
          className="relative"
          onClick={handleToggle}
          aria-label="알림"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Bell className="w-4 h-4 text-gray-700" />
          {Badge}
        </button>
        {isOpen && (
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationClick={handleNotificationClick}
            onMarkAllRead={markAllRead}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  },
);
NotificationBell.displayName = "NotificationBell";
