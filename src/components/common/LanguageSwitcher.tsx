"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { locales, type Locale } from "@/i18n/config";
import { setLocaleCookie } from "@/i18n/cookie";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const activeLocale = useLocale() as Locale;
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen]);

  const handleSelect = (locale: Locale) => {
    setIsOpen(false);
    if (locale === activeLocale) return;
    // 쿠키를 클라이언트에서 직접 설정해, 바로 다음 요청(refresh)에 확정적으로 실리게 한다.
    setLocaleCookie(locale);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10"
        aria-label={t("label")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={isPending}
        onClick={() => setIsOpen((v) => !v)}
      >
        <Globe className="w-5 h-5 text-gray-700" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleSelect(locale)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-teal-50 flex items-center justify-between gap-2"
            >
              {t(locale)}
              {locale === activeLocale && (
                <Check className="w-4 h-4 text-teal-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
