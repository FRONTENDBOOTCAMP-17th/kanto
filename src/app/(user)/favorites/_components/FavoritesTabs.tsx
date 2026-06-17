"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const TABS = [
  { key: "used_goods" },
  { key: "jobs" },
  { key: "rental" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function FavoritesTabs({
  activeType,
  tabPath,
}: {
  activeType: TabKey;
  tabPath: string;
}) {
  const t = useTranslations("Favorites");
  return (
    <div role="tablist" aria-label={t("tabsAria")} className="flex gap-6 items-end">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          role="tab"
          aria-selected={activeType === tab.key}
          href={`${tabPath}?type=${tab.key}`}
          className={`cursor-pointer ${
            activeType === tab.key
              ? "text-black text-2xl underline underline-offset-8 font-semibold"
              : "text-gray-400 text-xl"
          }`}
        >
          {t(`tabs.${tab.key}`)}
        </Link>
      ))}
    </div>
  );
}
