"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDropdown } from "./NotificationDropdown";
import type { Notification } from "@/hooks/useNotifications";

function getHref(n: Notification): string | undefined {
  if (!n.related_type || !n.related_id) return undefined;
  if (n.related_type === "usedgoods") return `/usedgoods/${n.related_id}`;
  if (n.related_type === "job") return `/job/${n.related_id}`;
  if (n.related_type === "chat") return ROUTES.chatRoom(n.related_id);
}

interface Props {
  onOpen?: () => void;
}

export interface NotificationBellHandle {
  close: () => void;
}

export const NotificationBell = forwardRef<NotificationBellHandle, Props>(
  ({ onOpen }, ref) => {
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({ close: () => setIsOpen(false) }));

    useEffect(() => {
      const onClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node))
          setIsOpen(false);
      };
      if (isOpen) document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }, [isOpen]);

    const handleToggle = () => {
      setIsOpen((v) => {
        if (!v) onOpen?.();
        return !v;
      });
    };

    const handleNotificationClick = async (n: Notification) => {
      await markAsRead(n);
      setIsOpen(false);
      const href = getHref(n);
      if (href) router.push(href);
    };

    const Badge = unreadCount > 0 && (
      <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold px-0.5">
        {unreadCount}
      </span>
    );

    return (
      <>
        {/* 데스크탑 벨 + 드롭다운 */}
        <div className="relative hidden md:flex" ref={containerRef}>
          <Button variant="ghost" size="icon" className="relative" onClick={handleToggle}>
            <Bell className="w-5 h-5 text-gray-700" />
            {Badge}
          </Button>
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

        {/* 모바일 벨 */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden relative"
          onClick={() => router.push(ROUTES.notifications)}
        >
          <Bell className="w-5 h-5 text-gray-700" />
          {Badge}
        </Button>
      </>
    );
  },
);
NotificationBell.displayName = "NotificationBell";
