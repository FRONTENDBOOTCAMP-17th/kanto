// 칸토 go! 시간 처리 — 번개모임은 마닐라 현지(Asia/Manila, UTC+8, DST 없음) 벽시계 기준.
// 저장(서버)·표시(클라이언트) 모두 이 모듈을 거쳐 서버/브라우저 TZ에 의존하지 않도록 한다.

export const MANILA_TZ = "Asia/Manila";
const MANILA_OFFSET = "+08:00";

/**
 * 마닐라 벽시계(date: "YYYY-MM-DD", time: "HH:mm")를 UTC ISO 문자열로 변환.
 * 오프셋을 명시해 런타임(서버) 로컬 TZ에 의존하지 않게 한다.
 */
export function manilaWallTimeToISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00${MANILA_OFFSET}`).toISOString();
}

/**
 * 저장된 UTC 시각을 마닐라 기준 "HH:mm" (24시간제)로 포맷. 숫자라 로케일 무관.
 */
export function formatManilaTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: MANILA_TZ,
  });
}

/**
 * "HH:mm ~ HH:mm" 마닐라 기준 시간 범위.
 */
export function formatManilaTimeRange(startISO: string, endISO: string): string {
  return `${formatManilaTime(startISO)} ~ ${formatManilaTime(endISO)}`;
}
