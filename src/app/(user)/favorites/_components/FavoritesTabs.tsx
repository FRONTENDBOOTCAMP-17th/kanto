"use client";

import Link from "next/link";

const TABS = [
  { key: "used_goods", label: "중고거래" },
  { key: "jobs", label: "구인구직" },
  { key: "rental", label: "방렌트" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function FavoritesTabs({ activeType }: { activeType: TabKey }) {
  return (
    <div role="tablist" aria-label="찜 목록 카테고리" className="flex gap-6 items-end">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          role="tab"
          aria-selected={activeType === tab.key}
          href={`/favorites?type=${tab.key}`}
          className={`cursor-pointer ${
            activeType === tab.key
              ? "text-black text-2xl underline underline-offset-8 font-semibold"
              : "text-gray-400 text-xl"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
