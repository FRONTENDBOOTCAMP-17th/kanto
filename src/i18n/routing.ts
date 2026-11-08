import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale, LOCALE_COOKIE } from "./config";

// 로케일을 쿠키가 아닌 URL 경로로 구분해 페이지를 정적(ISR)으로 캐시할 수 있게 한다.
// - as-needed: 기본 로케일(ko)은 접두사 없이 기존 URL(/main, /usedgoods/...)을 그대로 유지하고
//   en/fil만 /en/main, /fil/main 처럼 접두사를 붙인다.
// - 접두사 없는 URL로 들어오면 미들웨어가 NEXT_LOCALE 쿠키 → Accept-Language 순으로 판단해
//   en/fil 사용자는 /en/..., /fil/... 로 리다이렉트한다 (기존 쿠키 기반 언어 유지 동작 대체).
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeCookie: {
    name: LOCALE_COOKIE,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
});
