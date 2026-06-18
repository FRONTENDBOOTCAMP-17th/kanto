"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Flag,
  MessageSquare,
  LogOut,
  MapPin,
  Menu,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "대시보드", href: "/admin" },
  { icon: FileText, label: "글 관리", href: "/admin/posts" },
  { icon: Users, label: "유저 관리", href: "/admin/users" },
  { icon: Flag, label: "신고 내역", href: "/admin/reports" },
  { icon: MessageSquare, label: "채팅기록", href: null },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#f5f7f8] text-gray-900">
      {/* 모바일시 사이드바 숨겨짐 */}
      <header className="fixed inset-x-0 top-0 z-50 hidden h-[58px] items-center justify-between border-b border-[#ebeef0] bg-white px-4 max-[760px]:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-teal-500">
            <MapPin
              className="h-[18px] w-[18px] text-white"
              strokeWidth={2.2}
            />
          </div>
          <span className="text-[19px] font-extrabold tracking-tight text-slate-900">
            kanto
          </span>
          <span className="rounded-md border border-teal-100 bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-600">
            ADMIN
          </span>
        </div>
        <button
          onClick={() => setNavOpen(true)}
          className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#ebeef0] bg-white"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5 text-slate-900" />
          <span className="absolute right-2 top-[7px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
        </button>
      </header>

      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-[55] hidden bg-slate-900/45 max-[760px]:block"
        />
      )}

      {/* 사이드바 */}
      <aside
        className={[
          "sticky top-0 flex h-screen w-[250px] flex-shrink-0 flex-col border-r border-[#ebeef0] bg-white px-4 py-[22px]",
          "max-[760px]:fixed max-[760px]:left-0 max-[760px]:top-0 max-[760px]:z-[60] max-[760px]:shadow-2xl",
          "max-[760px]:transition-transform max-[760px]:duration-300 max-[760px]:ease-out",
          navOpen
            ? "max-[760px]:translate-x-0"
            : "max-[760px]:-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center gap-2.5 px-2 pb-5 pt-1.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-teal-500">
            <MapPin className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-[21px] font-extrabold tracking-tight text-slate-900">
            kanto
          </span>
          <span className="rounded-md border border-teal-100 bg-teal-50 px-2 py-[3px] text-[11px] font-bold text-teal-600">
            ADMIN
          </span>
        </div>

        <div className="px-3 pb-2 pt-2 text-[11px] font-bold tracking-wider text-slate-400">
          운영 메뉴
        </div>
        <nav className="flex flex-col gap-[3px]">
          {navItems.map(({ icon: Icon, label, href, badge }) => {
            const isActive = href !== null && (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
            const className = [
              "flex items-center gap-3 rounded-[11px] px-[13px] py-[11px] text-left text-[14.5px]",
              isActive
                ? "bg-teal-50 font-semibold text-teal-600"
                : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              href === null ? "cursor-not-allowed opacity-40" : "",
            ].join(" ");
            const content = (
              <>
                <Icon className="h-[19px] w-[19px]" strokeWidth={2} />
                <span>{label}</span>
                {badge && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </>
            );
            return href !== null ? (
              <Link
                key={label}
                href={href}
                onClick={() => setNavOpen(false)}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <span key={label} className={className}>
                {content}
              </span>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5 rounded-[13px] border border-[#eef1f3] bg-slate-50 p-3">
          <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
            관
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[13.5px] font-bold text-slate-900">관리자</div>
            <div className="truncate text-xs text-slate-400">
              admin@kanto.ph
            </div>
          </div>
          <button
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="로그아웃"
          >
            <LogOut className="h-[17px] w-[17px]" strokeWidth={2} />
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-[22px] p-8 max-[760px]:p-4 max-[760px]:pt-[74px]">
        {children}
      </main>
    </div>
  );
}
