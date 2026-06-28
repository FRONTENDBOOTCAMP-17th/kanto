"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

const STORAGE_KEY = "notice_hidden_until";

interface Notice {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
}

function getHiddenIds(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const { ids, date } = JSON.parse(stored);
    return date === new Date().toDateString() ? (ids ?? []) : [];
  } catch {
    return [];
  }
}

export function NoticeBadge() {
  const [count, setCount] = useState(0);
  const user = useAuthStore((s) => s.user);
  const isSuspended =
    !!user?.suspended_until && new Date(user.suspended_until) > new Date();

  useEffect(() => {
    fetch("/api/admin/notices")
      .then((r) => r.json())
      .then((data: Notice[]) => {
        const now = new Date();
        const hiddenIds = getHiddenIds();
        const active = data.filter(
          (n) =>
            new Date(n.starts_at) <= now &&
            now <= new Date(n.ends_at) &&
            !hiddenIds.includes(n.id),
        );
        setCount(active.length);
      })
      .catch(() => {});
  }, []);

  if (!isSuspended && count === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {/* 계정 정지 배지 — 모바일 전용 */}
      {isSuspended && (
        <span className="md:hidden inline-flex items-center px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-wide leading-none">
          정지
        </span>
      )}

      {/* 공지 아이콘 */}
      {count > 0 && (
        <Link
          href="/notices"
          aria-label={`공지사항 ${count}개`}
          className="relative flex items-center gap-1 px-1.5 py-1 rounded-lg text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition-colors"
        >
          <Megaphone className="w-5 h-5" />
          {count > 1 ? (
            /* 다수 공지: 1/3 형태 */
            <span className="text-[11px] font-semibold tabular-nums leading-none text-teal-600">
              1/{count}
            </span>
          ) : (
            /* 단일 공지: 빨간 점 */
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          )}
        </Link>
      )}
    </div>
  );
}
