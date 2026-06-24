export const locales = ["ko", "en", "fil"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const BCP47_LOCALE: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
  fil: "fil",
};

export const TIME_BCP47_LOCALE: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
  fil: "en-US",
};
