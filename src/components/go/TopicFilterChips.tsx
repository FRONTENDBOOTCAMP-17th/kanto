"use client";

// 주제 필터 칩 바 (지도 상단 오버레이)

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { TOPIC_OPTIONS } from "@/constants/meetupTopics";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

interface TopicFilterChipsProps {
  value: MeetupTopicKey | "all";
  onChange: (topic: MeetupTopicKey | "all") => void;
  activeTopics?: Set<string>;
}

export function TopicFilterChips({ value, onChange, activeTopics }: TopicFilterChipsProps) {
  const t = useTranslations("Go");
  const [isOpen, setIsOpen] = useState(true);

  const visibleOptions = activeTopics
    ? TOPIC_OPTIONS.filter((opt) => activeTopics.has(opt.value) || value === opt.value)
    : TOPIC_OPTIONS;

  const all = [
    { value: "all" as const, color: "#0f172a", border: "#0f172a" },
    ...visibleOptions,
  ];

  const hasFilter = value !== "all";

  return (
    <div className="flex min-w-0 max-w-full items-center gap-2">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t("filter.toggle")}
        className="relative flex-none flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-white/92 shadow-md backdrop-blur-md transition-colors hover:bg-white"
        style={{ borderColor: hasFilter ? "#0f172a" : "#e2e8f0" }}
      >
        <SlidersHorizontal className="h-4 w-4 text-slate-700" strokeWidth={2} />
        {hasFilter && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-slate-900" />
        )}
      </button>

      {/* 칩 목록 — 가로 슬라이드 */}
      <div
        className="relative min-w-0 max-w-full overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxWidth: isOpen ? "1000px" : "0px", opacity: isOpen ? 1 : 0 }}
      >
        <div className="flex gap-2 overflow-x-auto pb-0.5 pr-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {all.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(active && opt.value !== "all" ? "all" : opt.value)}
                className="flex-none cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold backdrop-blur-md transition-all"
                style={{
                  background: active ? opt.color : "rgba(255,255,255,0.9)",
                  color: active ? "#fff" : opt.color,
                  borderColor: active ? opt.color : opt.border ?? "#e2e8f0",
                }}
              >
                {opt.value === "all" ? t("filter.all") : t(`topics.${opt.value}`)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
