

export const MANILA_TZ = "Asia/Manila";
const MANILA_OFFSET = "+08:00";

export function manilaWallTimeToISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00${MANILA_OFFSET}`).toISOString();
}

export function formatManilaTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: MANILA_TZ,
  });
}

export function formatManilaTimeRange(startISO: string, endISO: string): string {
  return `${formatManilaTime(startISO)} ~ ${formatManilaTime(endISO)}`;
}
