// 공통 시간 포맷 유틸 함수
//
// i18n 패턴: 로케일을 인자로 받아 Intl API로 포맷한다.
// 컴포넌트에서는 next-intl의 useLocale()로 얻은 값을 넘기면 된다.
//   const locale = useLocale();
//   formatTimeAgo(iso, locale);
// 인자를 생략하면 기존 동작(한국어)을 유지하므로 호출부를 점진적으로 교체할 수 있다.

import { BCP47_LOCALE, defaultLocale, type Locale } from "@/i18n/config";

/** 오전 10:00 와 같은 형태로 포맷 */
export function formatMessageTime(
  dateStr: string,
  locale: Locale = defaultLocale,
): string {
  const date = new Date(dateStr);

  return date.toLocaleTimeString(BCP47_LOCALE[locale], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** 어제 / N일 전 / N주 전 / N달 전과 같은 형태로 포맷 (당일은 시각 표시) */
export function formatChatListTime(
  dateStr: string | null,
  locale: Locale = defaultLocale,
): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const now = new Date();

  const diffDay = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDay === 0) return formatMessageTime(dateStr, locale);

  const rtf = new Intl.RelativeTimeFormat(BCP47_LOCALE[locale], {
    numeric: "auto",
  });

  const diffWeeks = Math.floor(diffDay / 7);
  const diffMonths = Math.floor(diffDay / 30);

  if (diffDay < 7) return rtf.format(-diffDay, "day");
  if (diffMonths < 1) return rtf.format(-diffWeeks, "week");

  return rtf.format(-diffMonths, "month");
}

/** 방금 전 / N분 전 / N시간 전 / N일 전 ... 형태로 포맷 */
export function formatTimeAgo(
  isoString: string,
  locale: Locale = defaultLocale,
): string {
  const rtf = new Intl.RelativeTimeFormat(BCP47_LOCALE[locale], {
    numeric: "auto",
  });

  const now = Date.now();
  const postCreated = new Date(isoString).getTime();

  const minutes = Math.floor((now - postCreated) / 60000);

  if (minutes < 1) return rtf.format(0, "second");
  if (minutes < 60) return rtf.format(-minutes, "minute");

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");

  const days = Math.floor(hours / 24);
  if (days < 7) return rtf.format(-days, "day");

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return rtf.format(-weeks, "week");

  const months = Math.floor(days / 30);
  if (months < 12) return rtf.format(-months, "month");

  const years = Math.floor(days / 365);

  return rtf.format(-years, "year");
}

/** 마감일까지 남은 기간을 D-7 / 오늘 마감 / 마감 형태로 포맷 */
export function formatDeadline(deadline: string): string {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffDay = Math.round(
    (startOfDay(new Date(deadline)).getTime() -
      startOfDay(new Date()).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDay < 0) return "마감";
  if (diffDay === 0) return "오늘 마감";

  return `D-${diffDay}`;
}

/** 날짜 구분선 포맷 */
export function formatDateDivider(
  dateStr: string,
  locale: Locale = defaultLocale,
): string {
  return new Date(dateStr).toLocaleDateString(
    BCP47_LOCALE[locale],
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
}