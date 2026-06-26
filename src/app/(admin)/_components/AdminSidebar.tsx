"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Flag,
  MessageSquare,
  Menu,
  Zap,
  CreditCard,
  Settings,
} from "lucide-react";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string | null;
  badge?: number;
};

export default function AdminSidebar({ pendingCount }: { pendingCount: number }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: "대시보드", href: "/admin" },
    { icon: FileText, label: "글 관리", href: "/admin/posts" },
    { icon: Users, label: "유저 관리", href: "/admin/users" },
    { icon: Flag, label: "신고 내역", href: "/admin/reports", badge: pendingCount || undefined },
    { icon: CreditCard, label: "결제 관리", href: "/admin/payments" },
    { icon: Zap, label: "번개모임 관리", href: "/admin/go" },
    { icon: MessageSquare, label: "채팅기록", href: "/admin/chats" },
    { icon: Settings, label: "운영 관리", href: "/admin/operation" },
  ];

  return (
    <>
      
      <header className="fixed inset-x-0 top-0 z-50 hidden h-14.5 items-center justify-between border-b border-[#ebeef0] bg-white px-4 max-lg:flex">
        <Link href="/admin" className="flex items-end hover:opacity-75 transition-opacity">
          <Image
            src="/worldcupLogo.png"
            alt="kanto 로고"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="-ml-2 mb-0.5 font-(family-name:--font-geist-sans) text-[17px] font-semibold leading-none tracking-tight text-teal-600">
            World Cup
          </span>
        </Link>
        <button
          onClick={() => setNavOpen(true)}
          className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#ebeef0] bg-white"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5 text-slate-900" />
          {pendingCount > 0 && (
            <span className="absolute right-2 top-1.75 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          )}
        </button>
      </header>

      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-55 hidden bg-slate-900/45 max-lg:block"
        />
      )}

      
      <aside
        className={[
          "sticky top-0 flex h-screen w-62.5 shrink-0 flex-col border-r border-[#ebeef0] bg-white px-4 py-5.5",
          "max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:z-60 max-lg:shadow-2xl",
          "max-lg:transition-transform max-lg:duration-300 max-lg:ease-out",
          navOpen
            ? "max-lg:translate-x-0"
            : "max-lg:-translate-x-full",
        ].join(" ")}
      >
        <Link href="/admin" className="flex items-end px-2 pb-5 pt-1.5 hover:opacity-75 transition-opacity">
          <Image
            src="/worldcupLogo.png"
            alt="kanto 로고"
            width={44}
            height={15}
            className="object-contain"
          />
          <span className="-ml-2 mb-0 font-(family-name:--font-geist-sans) text-[17px] font-semibold leading-none tracking-tight text-teal-600">
            World Cup
          </span>
        </Link>

        <div className="px-3 pb-2 pt-2 text-[11px] font-bold tracking-wider text-slate-400">
          운영 메뉴
        </div>
        <nav className="flex flex-col gap-0.75">
          {navItems.map(({ icon: Icon, label, href, badge }) => {
            const isActive =
              href !== null &&
              (href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href));
            const className = [
              "flex items-center gap-3 rounded-[11px] px-[13px] py-[11px] text-left text-[14.5px]",
              isActive
                ? "bg-teal-50 font-semibold text-teal-600"
                : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              href === null ? "cursor-not-allowed opacity-40" : "",
            ].join(" ");
            const content = (
              <>
                <Icon className="h-4.75 w-4.75" strokeWidth={2} />
                <span>{label}</span>
                {badge && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
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
      </aside>
    </>
  );
}
