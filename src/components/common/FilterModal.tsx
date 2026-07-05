"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useUrlParams } from "@/hooks/useUrlParams";

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterSection {
  key: string;
  label: string;
  options: FilterOption[];
  dependsOn?: string;
}

interface FilterModalProps {
  sections: FilterSection[];
  values: Record<string, string>;
  optionsMaps?: Record<string, Record<string, FilterOption[]>>;
  onClose: () => void;
  isClosing: boolean;
}

export function FilterModal({
  sections,
  values,
  optionsMaps,
  onClose,
  isClosing,
}: FilterModalProps) {
  const tc = useTranslations("Common");
  const { updateParams } = useUrlParams();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() => ({
    ...values,
  }));

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // 섹션 값 선택. 이 섹션에 의존하는 섹션(dependsOn)은 같은 setState 안에서 "all" 로 리셋한다.
  const select = (key: string, id: string) =>
    setDraft((d) => {
      const next = { ...d, [key]: id };
      for (const s of sections) {
        if (s.dependsOn === key) next[s.key] = "all";
      }
      return next;
    });

  const clearAll = () =>
    setDraft(Object.fromEntries(sections.map((s) => [s.key, "all"])));

  const apply = () => {
    updateParams(draft);
    onClose();
  };

  const optionsFor = (section: FilterSection): FilterOption[] => {
    if (section.dependsOn) {
      return optionsMaps?.[section.key]?.[draft[section.dependsOn]] ?? [];
    }
    return section.options;
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-100 bg-slate-900/55 ${
          isClosing
            ? "animate-[fadeOut_.3s_ease_forwards]"
            : "animate-[fadeIn_.3s_ease]"
        }`}
      />
      <div
        className={`fixed left-1/2 top-1/2 z-101 flex max-h-[90vh] w-140 max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:top-auto max-md:translate-x-0 max-md:translate-y-0 max-md:w-full max-md:max-w-full max-md:rounded-t-2xl max-md:rounded-b-none ${
          isClosing
            ? "md:animate-[modalPopOut_.3s_cubic-bezier(.4,0,.2,1)_forwards] max-md:animate-[slideOutDown_.3s_cubic-bezier(.4,0,.2,1)_forwards]"
            : "md:animate-[modalPopIn_.3s_cubic-bezier(.4,0,.2,1)] max-md:animate-[slideInUp_.3s_cubic-bezier(.4,0,.2,1)]"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
            {tc("filter.title")}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex flex-1 flex-col divide-y divide-slate-100 overflow-y-auto px-6">
          {sections.map((section) => {
            const current = draft[section.key] ?? "all";
            const hideOptions =
              section.dependsOn && draft[section.dependsOn] === "all";
            return (
              <div key={section.key} className="flex items-start gap-4 py-4">
                <p className="w-20 shrink-0 pt-2 text-[13px] font-bold text-slate-600">
                  {section.label}
                </p>
                {hideOptions ? (
                  <p className="pt-2 text-sm text-slate-400">
                    {tc("filter.barangayHint")}
                  </p>
                ) : (
                  <div className="flex flex-1 flex-wrap gap-2">
                    {[
                      { id: "all", label: tc("filter.all") },
                      ...optionsFor(section),
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => select(section.key, opt.id)}
                        className={`h-9 px-4 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors ${
                          current === opt.id
                            ? "bg-teal-500 border-teal-500 text-white"
                            : "bg-white border-gray-200 text-gray-700 hover:border-teal-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 gap-2.5 border-t border-slate-100 px-6 py-4">
          <button
            onClick={clearAll}
            className="flex-1 rounded-[11px] border border-slate-200 bg-slate-50 py-3.5 text-[14px] font-bold text-slate-600 hover:bg-slate-100"
          >
            {tc("filter.clearAll")}
          </button>
          <button
            onClick={apply}
            className="flex flex-[1.4] items-center justify-center rounded-[11px] bg-teal-500 py-3.5 text-[14px] font-bold text-white hover:bg-teal-600"
          >
            {tc("filter.apply")}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
