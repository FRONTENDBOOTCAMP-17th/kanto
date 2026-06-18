import type { Category } from "@/type/admin";

export const POST_TYPE_LABEL: Record<string, string> = {
  used_goods: "중고거래",
  community: "커뮤니티",
  jobs: "구인구직",
  rental: "방렌트",
};

export const CATEGORY = {
  중고거래: { fg: "#ea580c", bg: "#fff7ed" },
  커뮤니티: { fg: "#7c3aed", bg: "#f5f3ff" },
  구인구직: { fg: "#2563eb", bg: "#eff6ff" },
  방렌트: { fg: "#16a34a", bg: "#f0fdf4" },
} as const;

export const CAT_ORDER: Category[] = [
  "중고거래",
  "커뮤니티",
  "구인구직",
  "방렌트",
];

export const REPORT_COLORS: Record<string, string> = {
  "사기 · 거래 분쟁": "#ef4444",
  "욕설 · 비방": "#f97316",
  "스팸 · 광고": "#f59e0b",
  "허위 정보": "#8b5cf6",
  "불법 촬영물": "#ec4899",
  기타: "#64748b",
};
