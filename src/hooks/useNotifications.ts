"use client";

import { useState, useEffect, useId } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { Tables } from "@/type/supabase";

export type Notification = Tables<"common_notifications">;

export function useNotifications() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const instanceId = useId();

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
      .channel(`notifications:${userId}:${instanceId}`)
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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "common_notifications",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId]);

  const markAsRead = async (n: Notification) => {
    if (n.is_read) return;

    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)),
    );

    const { error } = await supabase
      .from("common_notifications")
      .update({ is_read: true })
      .eq("id", n.id);

    if (error) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: false } : item)),
      );
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    const snapshot = notifications;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

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
