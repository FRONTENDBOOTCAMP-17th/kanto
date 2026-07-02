"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Megaphone, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "notice_hidden_until";

interface Notice {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
}

function isHiddenToday(id: number): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const { ids, date } = JSON.parse(stored);
    return date === new Date().toDateString() && Array.isArray(ids) && ids.includes(id);
  } catch {
    return false;
  }
}

function saveHideToday(id: number) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let ids: number[] = [];
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === new Date().toDateString()) ids = parsed.ids ?? [];
    }
    if (!ids.includes(id)) ids.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids, date: new Date().toDateString() }));
  } catch {}
}

export function GoNoticeIcon() {
  const locale = useLocale();
  const tb = useTranslations("Notice.Banner");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch("/api/admin/notices")
      .then((r) => r.json())
      .then((data: Notice[]) => {
        const now = new Date();
        setNotices(data.filter((n) => new Date(n.starts_at) <= now && now <= new Date(n.ends_at)));
      })
      .catch(() => {});
  }, [locale]);

  const active = notices.filter((n) => !dismissedIds.includes(n.id) && !isHiddenToday(n.id));
  if (active.length === 0) return null;

  const safeIdx = Math.min(idx, active.length - 1);
  const current = active[safeIdx];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10"
        aria-label={tb("viewAriaLabel")}
        onClick={() => setOpen(true)}
      >
        <Megaphone className="w-5 h-5 text-gray-700" />
      </Button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-9999 flex items-center justify-center p-6"
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between bg-teal-500 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{tb("modalTitle")}</span>
                </div>
                <div className="flex items-center gap-1">
                  {active.length > 1 && (
                    <div className="mr-1 flex items-center gap-0.5">
                      <button
                        onClick={() => setIdx((i) => Math.max(0, i - 1))}
                        disabled={safeIdx === 0}
                        className="p-0.5 hover:opacity-70 disabled:opacity-30 transition-opacity"
                        aria-label={tb("prevAriaLabel")}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs tabular-nums opacity-90">
                        {safeIdx + 1}/{active.length}
                      </span>
                      <button
                        onClick={() => setIdx((i) => Math.min(active.length - 1, i + 1))}
                        disabled={safeIdx === active.length - 1}
                        className="p-0.5 hover:opacity-70 disabled:opacity-30 transition-opacity"
                        aria-label={tb("nextAriaLabel")}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 hover:opacity-70 transition-opacity"
                    aria-label={tb("closeModalAriaLabel")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm leading-relaxed text-gray-800">{current.title}</p>
              </div>
              <div className="px-5 pb-4">
                <label className="flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-teal-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        saveHideToday(current.id);
                        setDismissedIds((prev) => [...prev, current.id]);
                        setOpen(false);
                      }
                    }}
                  />
                  <span className="text-xs text-gray-500">{tb("hideToday")}</span>
                </label>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
