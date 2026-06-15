// 어드민 대시보드 공통 상수, 유틸 함수, 타입 모아둠
export const POST_TYPE_LABEL: Record<string, string> = {
  used_goods: "중고거래",
  community: "커뮤니티",
  jobs: "구인구직",
  job: "구인구직",
  rental: "방렌트",
};

export const CATEGORY = {
  중고거래: { fg: "#ea580c", bg: "#fff7ed" },
  커뮤니티: { fg: "#7c3aed", bg: "#f5f3ff" },
  구인구직: { fg: "#2563eb", bg: "#eff6ff" },
  방렌트: { fg: "#16a34a", bg: "#f0fdf4" },
} as const;
export type Category = keyof typeof CATEGORY;
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

export function normalizeReason(reason: string | null): string {
  if (!reason) return "기타";
  if (reason.includes("사기") || reason.includes("거래"))
    return "사기 · 거래 분쟁";
  if (reason.includes("욕설") || reason.includes("비방")) return "욕설 · 비방";
  if (reason.includes("스팸") || reason.includes("광고")) return "스팸 · 광고";
  if (reason.includes("허위")) return "허위 정보";
  if (reason.includes("불법") || reason.includes("촬영")) return "불법 촬영물";
  return "기타";
}

export function fillDailyGaps(
  raw: { day: string; count: number }[],
  days: number,
) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split("T")[0];
    const found = raw.find((r) => String(r.day).startsWith(key));
    return { day: key, count: Number(found?.count ?? 0) };
  });
}

export function daysSince(iso: string): number {
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export interface ReportedUser {
  user_id: number;
  name: string;
  avatar_url: string | null;
  report_count: number;
  latest_reason: string;
  first_reported_at: string;
}

export interface ReportedPost {
  post_id: number;
  title: string;
  post_type: string;
  report_count: number;
  latest_reason: string;
  first_reported_at: string;
}
