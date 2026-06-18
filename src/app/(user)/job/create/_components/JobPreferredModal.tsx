"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PREFERRED_CATEGORIES } from "@/type/job/jobCreate";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selected: string[];
  onToggle: (key: string) => void;
}

export function JobPreferredModal({ isOpen, onClose, selected, onToggle }: Props) {
  const t = useTranslations("Job");
  const te = useTranslations("Enums");
  const tc = useTranslations("Common");
  const [mounted, setMounted] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>(PREFERRED_CATEGORIES[0].group);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const activeItems =
    PREFERRED_CATEGORIES.find((c) => c.group === activeGroup)?.items ?? [];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="mx-4 flex h-[70vh] max-h-[520px] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800">{t("form.preferredSelect")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={tc("close")}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 본문: 좌측 대분류 / 우측 태그 */}
        <div className="flex min-h-0 flex-1">
          <div className="w-28 shrink-0 overflow-y-auto border-r border-gray-200">
            {PREFERRED_CATEGORIES.map((c) => {
              const count = c.items.filter((i) => selected.includes(i.key)).length;
              const active = c.group === activeGroup;
              return (
                <button
                  key={c.group}
                  type="button"
                  onClick={() => setActiveGroup(c.group)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                    active
                      ? "bg-teal-50 font-medium text-teal-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {te(`preferredGroup.${c.group}`)}
                  {count > 0 && (
                    <span className="rounded-full bg-teal-600 px-1.5 text-xs text-white">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex flex-wrap gap-2">
              {activeItems.map((item) => {
                const sel = selected.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onToggle(item.key)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      sel
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-teal-500"
                    }`}
                  >
                    {te(`preferredItem.${item.key}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end border-t border-gray-200 p-4">
          <Button variant="teal" onClick={onClose}>
            {t("form.preferredDone", { count: selected.length })}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
