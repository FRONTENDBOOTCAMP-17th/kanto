"use client";

// 주제 필터 칩 바 (지도 상단 오버레이)

import { TOPIC_OPTIONS } from "@/constants/meetupTopics";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

interface TopicFilterChipsProps {
  value: MeetupTopicKey | "all";
  onChange: (topic: MeetupTopicKey | "all") => void;
}

export function TopicFilterChips({ value, onChange }: TopicFilterChipsProps) {
  const all = [
    { value: "all" as const, label: "전체", color: "#0f172a", bg: "#0f172a", border: "#0f172a" },
    ...TOPIC_OPTIONS,
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {all.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-none whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold backdrop-blur-md transition-all"
            style={{
              background: active ? opt.color : "rgba(255,255,255,0.9)",
              color: active ? "#fff" : opt.color,
              borderColor: active ? opt.color : opt.border ?? "#e2e8f0",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
