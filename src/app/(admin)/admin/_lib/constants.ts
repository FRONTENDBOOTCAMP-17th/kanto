import type { Category } from "@/type/admin";

export const POST_TYPE_LABEL: Record<string, string> = {
  used_goods: "중고거래",
  meetup: "Kanto Go!",
  jobs: "구인구직",
  rental: "부동산",
};

export const CATEGORY = {
  중고거래: { fg: "#ea580c", bg: "#fff7ed" },
  "Kanto Go!": { fg: "#7c3aed", bg: "#f5f3ff" },
  구인구직: { fg: "#2563eb", bg: "#eff6ff" },
  부동산: { fg: "#16a34a", bg: "#f0fdf4" },
} as const;

export const CAT_ORDER: Category[] = [
  "중고거래",
  "Kanto Go!",
  "구인구직",
  "부동산",
];

export const REPORT_COLORS: Record<string, string> = {
  "사기 · 거래 분쟁": "#ef4444",
  "욕설 · 비방": "#f97316",
  "스팸 · 광고": "#f59e0b",
  "허위 정보": "#8b5cf6",
  "불법 게시물": "#ec4899",
  기타: "#64748b",
};
