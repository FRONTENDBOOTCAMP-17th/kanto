"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { defaultLocale, locales, LOCALE_COOKIE, BCP47_LOCALE, type Locale } from "./config";
import { setLocaleCookie } from "./cookie";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocaleSwitcher() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocaleSwitcher must be used within LocaleProvider");
  return ctx;
}

function readLocaleCookie(): Locale | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  );
  const value = match?.[1];
  return value && locales.includes(value as Locale) ? (value as Locale) : null;
}

export function LocaleProvider({
  initialMessages,
  children,
}: {
  initialMessages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<AbstractIntlMessages>(initialMessages);

  const setLocale = useCallback((next: Locale) => {
    setLocaleCookie(next);
    import(`../../messages/${next}.json`).then((mod) => {
      setMessages(mod.default);
      setLocaleState(next);
      document.documentElement.lang = BCP47_LOCALE[next];
    });
  }, []);

  // 서버는 항상 기본 로케일(ko)로 렌더링한다(캐싱 가능하게 하기 위해 cookies()/headers() 미사용).
  // 실제 언어 선호는 마운트 직후 클라이언트에서 쿠키를 읽어 반영한다.
  useEffect(() => {
    const saved = readLocaleCookie();
    if (saved && saved !== defaultLocale) setLocale(saved);
  }, [setLocale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Manila">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
