export const locales = ["ko", "en", "ta"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Intl API(toLocaleString 등)와 <html lang>에 사용할 BCP-47 태그.
 * 주의: "ta"는 이 앱의 내부 로케일 키로 '타갈로그'를 의미하지만,
 * BCP-47 표준에서 "ta"는 타밀어다. 타갈로그/필리핀어는 "fil"로 매핑한다.
 */
export const BCP47_LOCALE: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
  ta: "fil",
};
