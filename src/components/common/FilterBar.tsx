"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";
import { useUrlParams } from "@/hooks/useUrlParams";
import {
  FilterModal,
  type FilterSection,
  type FilterOption,
} from "./FilterModal";

interface FilterBarProps {
  sections: FilterSection[];
  values: Record<string, string>;
  optionsMaps?: Record<string, Record<string, FilterOption[]>>;
}

export function FilterBar({ sections, values, optionsMaps }: FilterBarProps) {
  const tc = useTranslations("Common");
  const { updateParams } = useUrlParams();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 300);
  };

  const activeSections = sections.filter(
    (s) => (values[s.key] ?? "all") !== "all",
  );

  // 의존 옵션(barangay)은 값 자체가 사람이 읽을 수 있는 지명이라 value 를 그대로 라벨로 쓴다.
  const labelFor = (section: FilterSection, value: string) =>
    section.dependsOn
      ? value
      : (section.options.find((o) => o.id === value)?.label ?? value);

  // 칩 제거: 이 섹션에 의존하는 섹션(barangay 등)도 함께 "all" 로 넘겨 캐스케이드 해제.
  const removeChip = (section: FilterSection) => {
    const cascade: Record<string, string> = { [section.key]: "all" };
    for (const s of sections) {
      if (s.dependsOn === section.key) cascade[s.key] = "all";
    }
    updateParams(cascade);
  };

  return (
    <>
      <div
        className="flex items-center gap-2 overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-teal-300 transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{tc("filter.button")}</span>
          {activeSections.length > 0 && (
            <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-500 px-1.5 text-xs font-bold text-white">
              {activeSections.length}
            </span>
          )}
        </button>

        {activeSections.map((section) => {
          const label = labelFor(section, values[section.key]);
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => removeChip(section)}
              aria-label={tc("filter.removeChip", { label })}
              className="shrink-0 flex items-center gap-1 h-9 pl-4 pr-3 rounded-full border border-teal-500 bg-teal-50 text-sm font-semibold text-teal-700 whitespace-nowrap cursor-pointer"
            >
              <span>{label}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>

      {open && (
        <FilterModal
          sections={sections}
          values={values}
          optionsMaps={optionsMaps}
          onClose={close}
          isClosing={closing}
        />
      )}
    </>
  );
}
