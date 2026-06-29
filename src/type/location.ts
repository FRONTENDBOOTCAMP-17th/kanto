export const TRADE_LOCATIONS = [
  "BGC / Taguig",
  "Makati",
  "Pasay / Paranaque",
  "Quezon City",
  "Mandaluyong / Pasig",
  "Pampanga",
  "그 외 지역",
] as const;

export type TradeLocation = (typeof TRADE_LOCATIONS)[number];

// ── 거래지역 바랑가이 세분화 유틸 ──────────────────────────────
// Google Places(Place) addressComponents 에서 바랑가이/시/주를 추출하고,
// 시→광역 enum 매핑, 좌표 클램프(소수점 2자리)를 담당.

// place.addressComponents 의 최소 형태 (Place class)
export interface PlaceAddressComponent {
  types: string[];
  longText?: string | null;
  shortText?: string | null;
}

function pickComponent(components: PlaceAddressComponent[], types: string[]): string | null {
  for (const t of types) {
    const c = components.find((comp) => comp.types.includes(t));
    if (c?.longText) return c.longText;
  }
  return null;
}

// PH 주소는 바랑가이가 일관된 필드로 오지 않아 우선순위 폴백으로 추출.
export function extractBarangayCity(components: PlaceAddressComponent[]): {
  barangay: string | null;
  city: string | null;
  province: string | null;
} {
  const barangay = pickComponent(components, [
    "sublocality_level_1",
    "administrative_area_level_3",
    "neighborhood",
    "sublocality",
  ]);
  const city = pickComponent(components, ["locality", "administrative_area_level_2"]);
  const province = pickComponent(components, ["administrative_area_level_1"]);
  return { barangay, city, province };
}

// 추출한 시/주 문자열을 기존 광역 enum 그룹으로 매핑 (1단계 목록 필터 호환). 없으면 "그 외 지역".
export function cityToTradeLocation(city: string | null, province: string | null): TradeLocation {
  const hay = `${city ?? ""} ${province ?? ""}`.toLowerCase();
  if (hay.includes("taguig") || hay.includes("bonifacio") || hay.includes("bgc")) return "BGC / Taguig";
  if (hay.includes("makati")) return "Makati";
  if (hay.includes("pasay") || hay.includes("parañaque") || hay.includes("paranaque")) return "Pasay / Paranaque";
  if (hay.includes("quezon")) return "Quezon City";
  if (hay.includes("mandaluyong") || hay.includes("pasig")) return "Mandaluyong / Pasig";
  if (
    hay.includes("pampanga") ||
    hay.includes("angeles") ||
    hay.includes("san fernando") ||
    hay.includes("mabalacat") ||
    hay.includes("clark")
  )
    return "Pampanga";
  return "그 외 지역";
}

// 좌표를 소수점 2자리(≈1.1km)로 반올림 — 정확한 핀 복원 불가하도록 저장 직전 클램프.
export function roundCoord(n: number): number {
  return Math.round(n * 100) / 100;
}

// 카드/상세 표시용 라벨: "Brgy. xxx, City" (바랑가이 없으면 시만, 둘 다 없으면 빈 문자열)
export function formatBarangayLabel(barangay: string | null, city: string | null): string {
  if (!barangay) return city ?? "";
  const b = /barangay|brgy/i.test(barangay) ? barangay : `Brgy. ${barangay}`;
  return city ? `${b}, ${city}` : b;
}
