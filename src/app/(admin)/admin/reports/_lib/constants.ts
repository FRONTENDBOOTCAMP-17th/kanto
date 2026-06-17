import type { Status, Sanction } from "@/type/admin";

export const REASON_STYLE: Record<string, { fg: string; bg: string }> = {
  욕설: { fg: "#ea580c", bg: "#fff7ed" },
  도배: { fg: "#f97316", bg: "#fff7ed" },
  사기: { fg: "#dc2626", bg: "#fef2f2" },
  "허위 매물": { fg: "#8b5cf6", bg: "#f5f3ff" },
  "불법 게시물": { fg: "#b91c1c", bg: "#fef2f2" },
  "성 범죄(성희롱/성추행 등)": { fg: "#be185d", bg: "#fdf2f8" },
  기타: { fg: "#64748b", bg: "#f1f5f9" },
};

export const CATEGORY_STYLE: Record<string, { fg: string; bg: string }> = {
  중고거래: { fg: "#ea580c", bg: "#fff7ed" },
  커뮤니티: { fg: "#7c3aed", bg: "#f5f3ff" },
  구인구직: { fg: "#2563eb", bg: "#eff6ff" },
  방렌트: { fg: "#16a34a", bg: "#f0fdf4" },
};

export const STATUS_STYLE: Record<Status, { label: string; bg: string; fg: string }> = {
  pending: { label: "대기중", bg: "#fef9c3", fg: "#a16207" },
  resolved: { label: "처리완료", bg: "#dcfce7", fg: "#15803d" },
  dismissed: { label: "무시됨", bg: "#f1f5f9", fg: "#64748b" },
};

export const SANCTION_LABEL: Record<Exclude<Sanction, "none">, string> = {
  "7d": "7일 정지",
  "30d": "30일 정지",
  perm: "영구 정지",
};

export const PAGE_SIZE = 12;

export function normalizeReportReason(cat: string): string {
  const c = cat.trim();
  if (c.includes("욕설") || c.includes("도배")) return "욕설 및 도배";
  if (c.includes("사기")) return "사기";
  if (c.includes("허위")) return "허위 게시글";
  if (c.includes("불법")) return "불법 게시물";
  if (
    c.includes("성") &&
    (c.includes("범죄") || c.includes("희롱") || c.includes("추행"))
  )
    return "성적 콘텐츠 / 성범죄";
  if (c.includes("개인정보")) return "개인정보 침해";
  return "기타";
}
