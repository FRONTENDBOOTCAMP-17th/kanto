"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import MainCard, { type MainCardItem } from "../MainCard";
import PopularList from "./PopularList";

type TabKey = "usedGoods" | "jobs" | "rentals";

interface Props {
  usedGoodsItems: MainCardItem[];
  jobItems: MainCardItem[];
  rentalItems: MainCardItem[];
}

const TABS: { key: TabKey; label: string; link: string }[] = [
  { key: "usedGoods", label: "중고거래", link: "/usedgoods" },
  { key: "jobs", label: "구인구직", link: "/job" },
  { key: "rentals", label: "방렌트", link: "/rental" },
];

export default function PopularTabs({ usedGoodsItems, jobItems, rentalItems }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("usedGoods");

  const itemsMap: Record<TabKey, { items: MainCardItem[]; link: string }> = {
    usedGoods: { items: usedGoodsItems, link: "/usedgoods" },
    jobs: { items: jobItems, link: "/job" },
    rentals: { items: rentalItems, link: "/rental" },
  };

  const { items: activeItems, link: activeLink } = itemsMap[activeTab];

  return (
    <>
      <div className="md:hidden">
        <PopularList title="중고거래" items={usedGoodsItems} link="/usedgoods" />
        <PopularList title="구인구직" items={jobItems} link="/job" />
        <PopularList title="방렌트" items={rentalItems} link="/rental" />
      </div>

      <div className="hidden md:block">
        <div className="section-header">
          <div role="tablist" aria-label="인기 카테고리" className="flex gap-6 items-end">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`tab-panel-${tab.key}`}
                id={`tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`cursor-pointer ${
                  activeTab === tab.key
                    ? "text-black text-2xl underline underline-offset-8 font-semibold"
                    : "text-gray-400 text-xl"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Link
            href={activeLink}
            className="flex gap-1 items-center text-teal-500 font-medium text-sm"
          >
            전체보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div
          role="tabpanel"
          id={`tab-panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="grid grid-cols-4 gap-4"
        >
          {activeItems.map((item) => (
            <MainCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}
