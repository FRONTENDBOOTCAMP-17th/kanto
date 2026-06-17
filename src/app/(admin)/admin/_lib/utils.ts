export function normalizeReason(category: string | null): string {
  if (!category) return "기타";
  if (category.includes("사기") || category.includes("거래"))
    return "사기 · 거래 분쟁";
  if (category.includes("욕설") || category.includes("비방"))
    return "욕설 · 비방";
  if (
    category.includes("도배") ||
    category.includes("스팸") ||
    category.includes("광고")
  )
    return "스팸 · 광고";
  if (category.includes("허위")) return "허위 정보";
  if (
    category.includes("불법") ||
    category.includes("촬영") ||
    category.includes("성 범죄")
  )
    return "불법 촬영물";
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
