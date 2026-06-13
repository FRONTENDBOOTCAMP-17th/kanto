"use client";

import { User, Star, Bell, UserX, Settings2 } from "lucide-react";

export type Tab = "info" | "reviews" | "alerts" | "blocked" | "settings";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "info", label: "정보", icon: User },
  { key: "reviews", label: "후기", icon: Star },
  { key: "alerts", label: "알림", icon: Bell },
  { key: "blocked", label: "차단", icon: UserX },
  { key: "settings", label: "앱 설정", icon: Settings2 },
];

export function ProfileAside({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <aside className="hidden md:flex flex-col w-32 shrink-0 border-r border-gray-100 pr-3 pt-1 gap-1">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors cursor-pointer
            ${activeTab === key
              ? "bg-teal-50 text-teal-600"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {label}
        </button>
      ))}
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
  return (
    <div className="flex md:hidden gap-1.5 overflow-x-auto border-b border-gray-100 px-5 py-3">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer
            ${activeTab === key
              ? "bg-teal-500 text-white"
              : "text-gray-500 bg-gray-100 hover:bg-gray-200"}`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );
}
