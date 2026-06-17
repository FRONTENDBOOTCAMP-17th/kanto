import { LOCALE_COOKIE, type Locale } from "./config";

/** 선택한 언어를 클라이언트 쿠키에 저장한다. 호출 후 router.refresh()로 재렌더한다. */
export function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}
