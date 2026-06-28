"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Megaphone,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
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
    const { ids, date } = JSON.parse(stored);
    return date === new Date().toDateString() && Array.isArray(ids) && ids.includes(noticeId);
  } catch {
    return false;
  }
}

function saveHideToday(noticeId: number) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let ids: number[] = [];
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === new Date().toDateString()) ids = parsed.ids ?? [];
    }
    if (!ids.includes(noticeId)) ids.push(noticeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids, date: new Date().toDateString() }));
  } catch {}
}

export function UnifiedBanner() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const t = useTranslations("Common");
  const locale = useLocale();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [hideTodayChecked, setHideTodayChecked] = useState(false);

  // 데스크톱 배너용 (공지+제재 혼합 네비게이션)
  const [desktopIndex, setDesktopIndex] = useState(0);

  // 모바일 공지 모달
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);

  // 모바일 제재 모달
  const [suspensionModalOpen, setSuspensionModalOpen] = useState(false);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setDismissedIds([]);
    setHideTodayChecked(false);
  }

  useEffect(() => {
    fetch("/api/admin/notices")
      .then((res) => res.json())
      .then((data: Notice[]) => {
        const now = new Date();
        const active = data.filter(
          (n) => new Date(n.starts_at) <= now && now <= new Date(n.ends_at),
        );
        setNotices(active);
      })
      .catch(() => {});
  }, []);

  const items = useMemo<BannerItem[]>(() => {
    const result: BannerItem[] = [];
    const suspendedUntil = user?.suspended_until;
    for (const n of notices) {
      if (!dismissedIds.includes(n.id) && !isHiddenToday(n.id)) {
        result.push({ type: "notice", notice: n });
      }
    }
    if (suspendedUntil && new Date(suspendedUntil) > new Date()) {
      result.push({ type: "suspension", suspendedUntil });
    }
    return result;
  }, [notices, dismissedIds, user]);

  const noticeItems = useMemo(
    () => items.filter((i): i is { type: "notice"; notice: Notice } => i.type === "notice"),
    [items],
  );

  const suspensionItem = items.find(
    (i): i is { type: "suspension"; suspendedUntil: string } => i.type === "suspension",
  );
  const hasSuspension = !!suspensionItem;
  const noticeCount = noticeItems.length;

  // 제재 날짜 문자열
  let suspensionDateStr = "";
  let isPermanent = false;
  if (suspensionItem) {
    const date = new Date(suspensionItem.suspendedUntil);
    isPermanent = date.getFullYear() >= 9999;
    suspensionDateStr = date.toLocaleString(
      locale === "fil" ? "fil-PH" : locale === "en" ? "en-US" : "ko-KR",
      { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" },
    );
  }

  function handleDismissNotice(noticeId: number, forceHideToday = false) {
    if (forceHideToday || hideTodayChecked) saveHideToday(noticeId);
    setDismissedIds((prev) => [...prev, noticeId]);
    setHideTodayChecked(false);
    setNoticeModalOpen(false);
  }

  if (items.length === 0) return null;

  // ── 데스크톱 배너용 변수 ──────────────────────────────────────────
  const safeDesktopIndex = Math.min(desktopIndex, items.length - 1);
  const desktopCurrent = items[safeDesktopIndex];
  const hasMultiple = items.length > 1;
  const desktopBgColor = desktopCurrent.type === "suspension" ? "bg-red-600" : "bg-teal-500";

  // ── 모바일 공지 모달용 변수 ───────────────────────────────────────
  const safeNoticeIndex = Math.min(noticeIndex, Math.max(0, noticeItems.length - 1));
  const currentNotice = noticeItems[safeNoticeIndex];
  const hasMultipleNotices = noticeItems.length > 1;

  return (
    <>
      {/* ── 모바일: 공지 탭 + 제재 뱃지 ────────────────────────────── */}
      <div className="md:hidden relative h-0 overflow-visible">
        <div className="absolute -top-1.5 right-4 flex items-start gap-2">

          {/* 공지 탭 */}
          {noticeCount > 0 && (
            <button
              onClick={() => setNoticeModalOpen(true)}
              aria-label="공지 보기"
              className="flex flex-col items-center gap-1.5 bg-teal-500 text-white px-3 pt-4 pb-3.5 rounded-b-2xl shadow-md active:translate-y-1.5 transition-transform"
            >
              <Megaphone className="w-4 h-4" />
              {noticeCount > 1 && (
                <span className="text-[11px] font-semibold tabular-nums leading-none">
                  1/{noticeCount}
                </span>
              )}
            </button>
          )}

          {/* 제재 뱃지 */}
          {hasSuspension && (
            <button
              onClick={() => setSuspensionModalOpen(true)}
              aria-label="제재 안내"
              className="flex flex-col items-center gap-1.5 bg-red-600 text-white px-3 pt-4 pb-3.5 rounded-b-2xl shadow-md active:translate-y-1.5 transition-transform"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>

      {/* ── 모바일: 공지 모달 ────────────────────────────────────────── */}
      {noticeModalOpen && noticeCount > 0 && createPortal(
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center p-6"
          onClick={() => setNoticeModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="bg-teal-500 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">공지사항</span>
              </div>
              <div className="flex items-center gap-1">
                {hasMultipleNotices && (
                  <div className="flex items-center gap-0.5 mr-1">
                    <button
                      onClick={() => setNoticeIndex((i) => Math.max(0, i - 1))}
                      disabled={safeNoticeIndex === 0}
                      className="p-0.5 hover:opacity-70 disabled:opacity-30 transition-opacity"
                      aria-label="이전"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs tabular-nums opacity-90">
                      {safeNoticeIndex + 1}/{noticeItems.length}
                    </span>
                    <button
                      onClick={() => setNoticeIndex((i) => Math.min(noticeItems.length - 1, i + 1))}
                      disabled={safeNoticeIndex === noticeItems.length - 1}
                      className="p-0.5 hover:opacity-70 disabled:opacity-30 transition-opacity"
                      aria-label="다음"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setNoticeModalOpen(false)}
                  className="p-1 hover:opacity-70 transition-opacity"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* 본문 */}
            <div className="px-5 py-4">
              <p className="text-sm text-gray-800 leading-relaxed">
                {currentNotice?.notice.title}
              </p>
            </div>
            {/* 오늘 하루 안보기 */}
            {currentNotice && (
              <div className="px-5 pb-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) handleDismissNotice(currentNotice.notice.id, true);
                    }}
                    className="w-4 h-4 accent-teal-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">오늘 하루 안보기</span>
                </label>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}

      {/* ── 모바일: 제재 모달 ────────────────────────────────────────── */}
      {suspensionModalOpen && hasSuspension && createPortal(
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center p-6"
          onClick={() => setSuspensionModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">{t("suspended.bannerTitle")}</span>
              </div>
              <button
                onClick={() => setSuspensionModalOpen(false)}
                className="p-1 hover:opacity-70 transition-opacity"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* 본문 */}
            <div className="px-5 py-4">
              <p className="text-sm text-gray-800 leading-relaxed">
                {isPermanent
                  ? t("suspended.bannerPermanent")
                  : t("suspended.until", { date: suspensionDateStr })}
              </p>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── 데스크톱: 기존 배너 (공지+제재 혼합) ───────────────────── */}
      <div className={`hidden md:block w-full ${desktopBgColor} text-white px-4 py-2.5`}>
        <div className="max-w-5xl mx-auto flex items-center relative">

          {hasMultiple && (
            <div className="absolute left-0 flex items-center gap-0.5 text-xs">
              <button
                onClick={() => setDesktopIndex((i) => Math.max(0, i - 1))}
                disabled={safeDesktopIndex === 0}
                className="p-0.5 hover:opacity-70 disabled:opacity-30 transition-opacity"
                aria-label="이전"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="opacity-90 tabular-nums">{safeDesktopIndex + 1}/{items.length}</span>
              <button
                onClick={() => setDesktopIndex((i) => Math.min(items.length - 1, i + 1))}
                disabled={safeDesktopIndex === items.length - 1}
                className="p-0.5 hover:opacity-70 disabled:opacity-30 transition-opacity"
                aria-label="다음"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center gap-2 px-20">
            {desktopCurrent.type === "notice" ? (
              <>
                <Megaphone className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium line-clamp-1">{desktopCurrent.notice.title}</p>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <p className="text-sm line-clamp-1">
                  <span className="font-semibold">{t("suspended.bannerTitle")}</span>{" "}
                  {isPermanent
                    ? t("suspended.bannerPermanent")
                    : t("suspended.until", { date: suspensionDateStr })}
                </p>
              </>
            )}
          </div>

          {desktopCurrent.type === "notice" && (
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
                onClick={() => handleDismissNotice(desktopCurrent.notice.id)}
                className="p-1 hover:opacity-70 transition-opacity"
                aria-label="공지 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
