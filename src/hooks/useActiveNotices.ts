"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";

export interface Notice {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
}

export const ACTIVE_NOTICES_QUERY_KEY = ["notices", "active"] as const;

async function fetchNotices(): Promise<Notice[]> {
  const res = await fetch("/api/admin/notices");
  if (!res.ok) throw new Error("공지를 불러오지 못했습니다.");
  return res.json();
}

function selectActive(notices: Notice[]): Notice[] {
  const now = new Date();
  return notices.filter((n) => new Date(n.starts_at) <= now && now <= new Date(n.ends_at));
}

export function useActiveNotices(initialNotices: Notice[]): Notice[] {
  const locale = useLocale();
  const { data = [] } = useQuery({
    queryKey: [...ACTIVE_NOTICES_QUERY_KEY, locale],
    queryFn: fetchNotices,
    initialData: initialNotices,
    staleTime: 5 * 60 * 1000,
    select: selectActive,
  });
  return data;
}
