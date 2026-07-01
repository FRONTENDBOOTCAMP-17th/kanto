"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "notice_hidden_until";

interface Notice {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
}

function isHiddenToday(noticeId: number): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const { id, date } = JSON.parse(stored);
    return id === noticeId && date === new Date().toDateString();
  } catch {
    return false;
  }
}

export function NoticeBanner() {
  const t = useTranslations("Notice.Banner");
  const pathname = usePathname();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    fetch("/api/admin/notices")
      .then((res) => res.json())
      .then((data: Notice[]) => {
        const now = new Date();
        const active = data.find(
          (n) => new Date(n.starts_at) <= now && now <= new Date(n.ends_at),
        );
        setNotice(active ?? null);
      })
      .catch(() => {});
  }, []);

  
  useEffect(() => {
    setDismissed(false);
    setHideToday(false);
  }, [pathname]);

  function handleDismiss() {
    if (hideToday && notice) hideNoticeToday(notice.id);
    setDismissed(true);
  }

  if (!notice || dismissed || isHiddenToday(notice.id)) return null;

  return (
    <div className="w-full bg-teal-500 text-white px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center relative">
        <div className="flex-1 flex items-center justify-center gap-2">
          <Megaphone className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium">{notice.title}</p>
        </div>
        <div className="absolute right-0 flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideToday}
              onChange={(e) => setHideToday(e.target.checked)}
              className="w-3.5 h-3.5 accent-white cursor-pointer"
            />
            <span className="text-xs opacity-90">{t("hideToday")}</span>
          </label>
          <button
            onClick={handleDismiss}
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label={t("closeAriaLabel")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function hideNoticeToday(noticeId: number) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ id: noticeId, date: new Date().toDateString() }),
  );
}
