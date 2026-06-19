"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useAuthStore } from "@/store/authStore";

export function SuspendedBanner() {
  const { user } = useAuthStore();
  const suspendedUntil = user?.suspended_until;
  const t = useTranslations("Common");
  const locale = useLocale();

  if (!suspendedUntil || new Date(suspendedUntil) <= new Date()) return null;

  const date = new Date(suspendedUntil);
  const isPermanent = date.getFullYear() >= 9999;
  const dateStr = date.toLocaleString(locale === "fil" ? "fil-PH" : locale === "en" ? "en-US" : "ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full bg-red-600 text-white px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <p className="text-sm">
          <span className="font-semibold">{t("suspended.bannerTitle")}</span>{" "}
          {isPermanent ? t("suspended.bannerPermanent") : t("suspended.until", { date: dateStr })}
        </p>
      </div>
    </div>
  );
}
