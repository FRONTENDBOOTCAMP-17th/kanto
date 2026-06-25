
import { BCP47_LOCALE, TIME_BCP47_LOCALE, defaultLocale, type Locale } from "@/i18n/config";

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

  const rtf = new Intl.RelativeTimeFormat(TIME_BCP47_LOCALE[locale], {
    numeric: "auto",
  });

  const diffWeeks = Math.floor(diffDay / 7);
  const diffMonths = Math.floor(diffDay / 30);

  if (diffDay < 7) return rtf.format(-diffDay, "day");
  if (diffMonths < 1) return rtf.format(-diffWeeks, "week");

  return rtf.format(-diffMonths, "month");
}

export function formatTimeAgo(
  isoString: string,
  locale: Locale = defaultLocale,
): string {
  const rtf = new Intl.RelativeTimeFormat(TIME_BCP47_LOCALE[locale], {
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

export function getDeadlineDiff(deadline: string): number {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round(
    (startOfDay(new Date(deadline)).getTime() -
      startOfDay(new Date()).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

export function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(date));
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

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