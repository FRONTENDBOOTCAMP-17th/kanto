"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const TABS = [
  { key: "used_goods" },
  { key: "jobs" },
  { key: "rental" },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type Counts = Record<TabKey, number>;

export function FavoritesTabs({
  activeType,
  tabPath,
  counts,
}: {
  activeType: TabKey;
  tabPath: string;
  counts?: Counts;
}) {
  const t = useTranslations("Favorites");
  return (
    <div role="tablist" aria-label={t("tabsAria")} className="flex gap-6 items-end">
      {TABS.map((tab) => {
        const count = counts?.[tab.key];
        const isActive = activeType === tab.key;
        return (
          <Link
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            href={`${tabPath}?type=${tab.key}`}
            className={`cursor-pointer inline-flex items-baseline gap-1 ${
              isActive ? "text-black font-semibold" : "text-gray-400"
            }`}
          >
            <span className={isActive ? "text-2xl underline underline-offset-8" : "text-xl"}>
              {t(`tabs.${tab.key}`)}
            </span>
            {count !== undefined && count > 0 && (
              <span className="text-[11px] font-medium">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
