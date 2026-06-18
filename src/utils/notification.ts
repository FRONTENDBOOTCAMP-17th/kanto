import type { Notification } from "@/hooks/useNotifications";

export function getNotificationHref(n: Notification): string | undefined {
  if (!n.related_type || !n.related_id) return undefined;
  if (n.related_type === "used_goods") return `/usedgoods/${n.related_id}`;
  if (n.related_type === "jobs") return `/job/${n.related_id}`;
  if (n.related_type === "rental") return `/rental/${n.related_id}`;
  if (n.related_type === "community") return `/community/${n.related_id}`;
}
