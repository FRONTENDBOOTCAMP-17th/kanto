import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { locales, defaultLocale, LOCALE_COOKIE, type Locale } from "./config";

function matchAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    if (tag.startsWith("ko")) return "ko";
    if (tag.startsWith("en")) return "en";
    if (tag.startsWith("fil") || tag.startsWith("tl")) return "fil";
  }
  return null;
}

export default getRequestConfig(async () => {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale =
    cookie && locales.includes(cookie as Locale)
      ? (cookie as Locale)
      : (matchAcceptLanguage((await headers()).get("accept-language")) ??
        defaultLocale);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
