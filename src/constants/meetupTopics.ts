// 칸토 go! 번개모임 주제 7종 (디자이너 확정 색상 체계)
// meetups.topic 컬럼 값으로 저장되는 키 · 필터 칩/핀 색도 동일 체계 사용

export const MEETUP_TOPICS = [
  { key: "food", label: "맛집/식사", pinColor: "#ea580c" },
  { key: "sports", label: "운동/스포츠", pinColor: "#16a34a" },
  { key: "study", label: "스터디/언어교환", pinColor: "#2563eb" },
  { key: "hobby", label: "취미/문화", pinColor: "#7c3aed" },
  { key: "trip", label: "나들이/여행", pinColor: "#0d9488" }, // 브랜드 틸
  { key: "social", label: "친목/수다", pinColor: "#db2777" },
  { key: "other", label: "기타", pinColor: "#64748b" },
] as const;

export type MeetupTopicKey = (typeof MEETUP_TOPICS)[number]["key"];

// 핀/뱃지 공용 — pinColor 외에 뱃지용 bg(연한 배경)/color(글자)/border 포함
export const TOPIC_META = Object.fromEntries(
  MEETUP_TOPICS.map((t) => [
    t.key,
    { ...t, bg: `${t.pinColor}1a`, color: t.pinColor, border: t.pinColor },
  ]),
) as Record<
  MeetupTopicKey,
  (typeof MEETUP_TOPICS)[number] & { bg: string; color: string; border: string }
>;

// 필터 칩용 — value/label/color(+border) 형태
export const TOPIC_OPTIONS = MEETUP_TOPICS.map((t) => ({
  value: t.key,
  label: t.label,
  color: t.pinColor,
  border: t.pinColor,
}));
