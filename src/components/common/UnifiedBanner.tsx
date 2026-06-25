"use client";

import { useEffect, useState, useMemo } from "react";
import { Megaphone, ShieldAlert, ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useTranslations, useLocale } from "next-intl";

const STORAGE_KEY = "notice_hidden_until";

interface Notice {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
}

type BannerItem =
  | { type: "notice"; notice: Notice }
  | { type: "suspension"; suspendedUntil: string };

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

function saveHideToday(noticeId: number) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ id: noticeId, date: new Date().toDateString() }),
  );
}

export function UnifiedBanner() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const t = useTranslations("Common");
  const locale = useLocale();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [hideTodayChecked, setHideTodayChecked] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // 페이지 이동 시 공지 닫힘 상태 리셋
  useEffect(() => {
    setNoticeDismissed(false);
    setHideTodayChecked(false);
  }, [pathname]);

  const items = useMemo<BannerItem[]>(() => {
    const result: BannerItem[] = [];
    const suspendedUntil = user?.suspended_until;

    if (notice && !noticeDismissed && !isHiddenToday(notice.id)) {
      result.push({ type: "notice", notice });
    }
    if (suspendedUntil && new Date(suspendedUntil) > new Date()) {
      result.push({ type: "suspension", suspendedUntil });
    }
    return result;
  }, [notice, noticeDismissed, user]);

  // items가 줄면 인덱스 보정
  useEffect(() => {
    if (items.length > 0 && currentIndex >= items.length) {
      setCurrentIndex(items.length - 1);
    }
  }, [items.length, currentIndex]);

  function handleDismissNotice() {
    if (hideTodayChecked && notice) saveHideToday(notice.id);
    setNoticeDismissed(true);
  }

  if (items.length === 0) return null;

  const safeIndex = Math.min(currentIndex, items.length - 1);
  const current = items[safeIndex];
  const hasMultiple = items.length > 1;

  let suspensionDateStr = "";
  let isPermanent = false;
  if (current.type === "suspension") {
    const date = new Date(current.suspendedUntil);
    isPermanent = date.getFullYear() >= 9999;
    suspensionDateStr = date.toLocaleString(
      locale === "fil" ? "fil-PH" : locale === "en" ? "en-US" : "ko-KR",
      { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" },
    );
  }

  const bgColor = current.type === "notice" ? "bg-teal-500" : "bg-red-600";

  return (
    <div className={`w-full ${bgColor} text-white px-4 py-2.5`}>
      <div className="max-w-5xl mx-auto flex items-center relative">

        {/* 좌측 페이지네이션 */}
        {hasMultiple && (
          <div className="absolute left-0 flex items-center gap-0.5 text-xs">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={safeIndex === 0}
              className="p-0.5 hover:opacity-70 disabled:opacity-30 transition-opacity"
              aria-label="이전"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="opacity-90 tabular-nums">{safeIndex + 1}/{items.length}</span>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(items.length - 1, i + 1))}
              disabled={safeIndex === items.length - 1}
              className="p-0.5 hover:opacity-70 disabled:opacity-30 transition-opacity"
              aria-label="다음"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 가운데 본문 */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {current.type === "notice" ? (
            <>
              <Megaphone className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium">{current.notice.title}</p>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">{t("suspended.bannerTitle")}</span>{" "}
                {isPermanent
                  ? t("suspended.bannerPermanent")
                  : t("suspended.until", { date: suspensionDateStr })}
              </p>
            </>
          )}
        </div>

        {/* 우측 컨트롤 (공지만) */}
        {current.type === "notice" && (
          <div className="absolute right-0 flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideTodayChecked}
                onChange={(e) => setHideTodayChecked(e.target.checked)}
                className="w-3.5 h-3.5 accent-white cursor-pointer"
              />
              <span className="text-xs opacity-90">오늘 하루 안보기</span>
            </label>
            <button
              onClick={handleDismissNotice}
              className="p-1 hover:opacity-70 transition-opacity"
              aria-label="공지 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
