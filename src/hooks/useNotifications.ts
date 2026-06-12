"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { Tables } from "@/type/supabase";

export type Notification = Tables<"common_notifications">;

export function useNotifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("common_notifications")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "common_notifications",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (n: Notification) => {
    if (n.is_read) return;

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === n.id ? { ...item, is_read: true } : item,
      ),
    );

    const { error } = await supabase
      .from("common_notifications")
      .update({ is_read: true })
      .eq("id", n.id);

    if (error) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, is_read: false } : item,
        ),
      );
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    const snapshot = notifications;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const { error } = await supabase
      .from("common_notifications")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    if (error) setNotifications(snapshot);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, unreadCount, markAsRead, markAllRead };
}
