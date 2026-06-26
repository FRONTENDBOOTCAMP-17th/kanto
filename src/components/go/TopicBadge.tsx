// 주제 뱃지 — TOPIC_META 색상 룩업 + 칩 스타일을 단일화.
// 라벨은 호출자가 주입(사용자단은 t(`topics.${topic}`), 어드민은 한국어 라벨).

import { TOPIC_META } from "@/constants/meetupTopics";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

interface TopicBadgeProps {
  topic: MeetupTopicKey;
  label: string;
  className?: string;
  bordered?: boolean;
}

const DEFAULT_CLASS = "inline-flex items-center rounded-full px-3 py-1 text-[12.5px] font-bold";

export function TopicBadge({
  topic,
  label,
  className = DEFAULT_CLASS,
  bordered = true,
}: TopicBadgeProps) {
  const meta = TOPIC_META[topic] ?? TOPIC_META.other;
  return (
    <span
      className={className}
      style={{
        background: meta.bg,
        color: meta.color,
        ...(bordered ? { border: `1px solid ${meta.border}` } : {}),
      }}
    >
      {label}
    </span>
  );
}
