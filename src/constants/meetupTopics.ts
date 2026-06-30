

export const MEETUP_TOPICS = [
  { key: "food", label: "맛집/식사", pinColor: "#ea580c" },
  { key: "sports", label: "운동/스포츠", pinColor: "#16a34a" },
  { key: "study", label: "스터디/언어교환", pinColor: "#2563eb" },
  { key: "hobby", label: "취미/문화", pinColor: "#7c3aed" },
  { key: "trip", label: "나들이/여행", pinColor: "#0d9488" }, 
  { key: "social", label: "친목/수다", pinColor: "#db2777" },
  { key: "other", label: "기타", pinColor: "#64748b" },
] as const;

export type MeetupTopicKey = (typeof MEETUP_TOPICS)[number]["key"];

export const TOPIC_META = Object.fromEntries(
  MEETUP_TOPICS.map((t) => [
    t.key,
    { ...t, bg: `${t.pinColor}1a`, color: t.pinColor, border: t.pinColor },
  ]),
) as Record<
  MeetupTopicKey,
  (typeof MEETUP_TOPICS)[number] & { bg: string; color: string; border: string }
>;

export const TOPIC_OPTIONS = MEETUP_TOPICS.map((t) => ({
  value: t.key,
  label: t.label,
  color: t.pinColor,
  border: t.pinColor,
}));
