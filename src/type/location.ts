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

export function roundCoord(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatBarangayLabel(barangay: string | null, city: string | null): string {
  if (!barangay) return city ?? "";
  const b = /barangay|brgy/i.test(barangay) ? barangay : `Brgy. ${barangay}`;
  return city ? `${b}, ${city}` : b;
}
