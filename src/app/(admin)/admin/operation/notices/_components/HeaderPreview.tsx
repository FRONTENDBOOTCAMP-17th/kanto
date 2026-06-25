"use client";

import {
  Bell,
  Globe,
  Menu,
  User,
  Megaphone,
  ShoppingBag,
  Briefcase,
  Home,
  MapPin,
} from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
  { icon: ShoppingBag, label: "중고거래" },
  { icon: Briefcase, label: "구인구직" },
  { icon: Home, label: "부동산" },
  { icon: MapPin, label: "번개모임" },
];

export function HeaderPreview({ noticeTitle }: { noticeTitle: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="border-b border-gray-200 bg-white">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center shrink-0">
            <Image src="/kantoMobileLogo.png" alt="kanto" width={36} height={36} className="block md:hidden" />
            <Image src="/kantoLogo.png" alt="kanto" width={100} height={46} className="hidden md:block" />
          </div>
          <div className="flex items-center gap-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500">
              <Globe className="h-4 w-4" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500">
              <Bell className="h-4 w-4" />
            </div>
            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-teal-600 md:flex">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 md:hidden">
              <Menu className="h-4 w-4" />
            </div>
          </div>
        </div>
        <div className="hidden items-center justify-center gap-1 border-t border-gray-100 px-4 py-1 md:flex">
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-gray-600"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full bg-teal-500 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2.5">
          <Megaphone className="h-4 w-4 shrink-0 text-white/80" strokeWidth={2} />
          <p className="text-center text-[13px] font-medium text-white">
            {noticeTitle.trim() || (
              <span className="text-white/50">공지 제목이 여기에 표시됩니다</span>
            )}
          </p>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="mb-3 h-5 w-40 rounded-md bg-slate-100" />
        <div className="flex flex-col gap-2">
          <div className="h-3.5 w-full rounded-md bg-slate-100" />
          <div className="h-3.5 w-5/6 rounded-md bg-slate-100" />
          <div className="h-3.5 w-4/6 rounded-md bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
