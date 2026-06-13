"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/constants/routes";
import type { Tables } from "@/type/supabase";

export type Notification = Tables<"common_notifications">;

export function useNotifications() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("common_notifications")
      .select("*")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "common_notifications",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const newItem = payload.new as Notification;
          setNotifications((prev) =>
            prev.some((n) => n.id === newItem.id) ? prev : [newItem, ...prev],
          );
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (n: Notification) => {
    if (n.is_read) return;

    setNotifications((prev) => prev.filter((item) => item.id !== n.id));

    const { error } = await supabase
      .from("common_notifications")
      .update({ is_read: true })
      .eq("id", n.id);

    if (error) {
      setNotifications((prev) => [n, ...prev]);
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    const snapshot = notifications;

    setNotifications([]);

    const { error } = await supabase
      .from("common_notifications")
      .update({ is_read: true })
      .eq("receiver_id", userId)
      .eq("is_read", false);

    if (error) setNotifications(snapshot);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, markAsRead, markAllRead };
}
