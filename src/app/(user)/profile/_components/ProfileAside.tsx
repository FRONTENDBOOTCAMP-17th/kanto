"use client";

import { User, Star, Bell, UserX, Settings2, CreditCard, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";

export type Tab = "info" | "payment" | "history" | "reviews" | "alerts" | "blocked" | "settings";

const TABS: { key: Tab; icon: React.ElementType }[] = [
  { key: "info", icon: User },
  { key: "payment", icon: CreditCard },
  { key: "history", icon: Receipt },
  { key: "reviews", icon: Star },
  { key: "alerts", icon: Bell },
  { key: "blocked", icon: UserX },
  { key: "settings", icon: Settings2 },
];

export function ProfileAside({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  const t = useTranslations("Profile.menu");
  return (
    <aside className="hidden md:flex flex-col w-32 shrink-0 border-r border-gray-100 pr-3 pt-1 gap-1">
      <nav role="tablist" aria-label={t("ariaMenu")}>
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => onTabChange(key)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors cursor-pointer
              ${activeTab === key
                ? "bg-teal-50 text-teal-600"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t(key)}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export function ProfileMobileTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  const t = useTranslations("Profile.menu");
  return (
    <nav role="tablist" aria-label={t("ariaMenu")} className="flex md:hidden gap-1.5 overflow-x-auto border-b border-gray-100 px-5 py-3">
      {TABS.map(({ key, icon: Icon }) => (
        <button
          key={key}
          role="tab"
          aria-selected={activeTab === key}
          onClick={() => onTabChange(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer
            ${activeTab === key
              ? "bg-teal-500 text-white"
              : "text-gray-500 bg-gray-100 hover:bg-gray-200"}`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {t(key)}
        </button>
      ))}
    </nav>
  );
}
