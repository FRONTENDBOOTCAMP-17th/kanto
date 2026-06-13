"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useAuthInit } from "@/hooks/useAuthInit";
import {
  Menu,
  User,
  X,
  ShoppingBag,
  Briefcase,
  Home,
  Heart,
  Users,
  Settings,
  ThumbsUp,
  FileText,
  LogOut,
  MessageCircle,
  Pencil,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { NotificationBell } from "./header/NotificationBell";
import type { NotificationBellHandle } from "./header/NotificationBell";

const NAV_ITEMS = [
  { name: "중고거래", icon: ShoppingBag, href: ROUTES.usedgoods },
  { name: "구인구직", icon: Briefcase, href: ROUTES.jobs },
  { name: "방렌트", icon: Home, href: ROUTES.rental },
  { name: "커뮤니티", icon: Users, href: ROUTES.community },
  { name: "랜덤채팅", icon: Heart, href: ROUTES.dating },
];

export function Header() {
  const router = useRouter();
  const { user } = useAuthStore();
  useAuthInit();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationBellRef = useRef<NotificationBellHandle>(null);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
    setIsProfileOpen(false);
    setIsMobileOpen(false);
  };

  const handleLogoutConfirm = async () => {
    setIsLogoutModalOpen(false);
    await supabase.auth.signOut();
    router.refresh();
    router.push(ROUTES.home);
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setIsProfileOpen(false);
    };
    if (isProfileOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isProfileOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="page-container">
        <div className="flex items-center justify-between h-12 md:h-16">
          {/* 로고 */}
          <Link
            href={ROUTES.home}
            className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <Image
              src="/kantoMobileLogo.png"
              alt="kanto"
              width={40}
              height={40}
              className="md:hidden"
            />
            <Image
              src="/kantoLogo.png"
              alt="kanto"
              width={120}
              height={40}
              className="hidden md:block"
            />
          </Link>

          <div className="flex-1" />

          {/* 우측 액션 버튼 */}
          <div className="flex items-center shrink-0">
            {/* 글쓰기 */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10"
                aria-label="글쓰기"
                onClick={() => router.push(ROUTES.create)}
              >
                <Pencil className="w-5 h-5 text-gray-700" />
              </Button>
            )}

            {/* 알림 */}
            {user && (
              <NotificationBell
                ref={notificationBellRef}
                onOpen={() => setIsProfileOpen(false)}
              />
            )}

            {/* 프로필 드롭다운 — 데스크탑 */}
            {user ? (
              <div className="relative hidden md:block" ref={profileRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12"
                  aria-label="내 프로필 메뉴"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                  onClick={() => {
                    setIsProfileOpen((v) => !v);
                    notificationBellRef.current?.close();
                  }}
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.name ?? "프로필"}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-md">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </Button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-12 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {[
                      {
                        label: "내 정보",
                        icon: Settings,
                        href: ROUTES.myProfile,
                      },
                      {
                        label: "찜 목록",
                        icon: ThumbsUp,
                        href: ROUTES.favorites,
                      },
                      {
                        label: "내 게시글",
                        icon: FileText,
                        href: ROUTES.myPosts,
                      },
                      {
                        label: "채팅 목록",
                        icon: MessageCircle,
                        href: ROUTES.chat,
                      },
                    ].map(({ label, icon: Icon, href }) => (
                      <button
                        key={href}
                        onClick={() => {
                          router.push(href);
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-teal-50 flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4 text-gray-500" />
                        {label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogoutClick}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                className="hidden md:flex bg-teal-500 hover:bg-teal-600 text-white"
                onClick={() => router.push(ROUTES.login)}
              >
                로그인
              </Button>
            )}

            {/* 모바일 햄버거 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-10 h-10"
              aria-label={isMobileOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={isMobileOpen}
              onClick={() => setIsMobileOpen((v) => !v)}
            >
              {isMobileOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </Button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileOpen && (
          <div className="md:hidden border-t border-gray-200 py-3">
            <nav className="space-y-0.5">
              {NAV_ITEMS.map(({ name, icon: Icon, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-500 rounded-lg transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{name}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-3 px-4 pt-3 border-t border-gray-100">
              {user ? (
                <div className="flex items-center justify-around">
                  {[
                    { icon: User, href: ROUTES.myProfile, label: "내 정보" },
                    { icon: Heart, href: ROUTES.favorites, label: "찜" },
                    { icon: FileText, href: ROUTES.myPosts, label: "내 글" },
                    { icon: MessageCircle, href: ROUTES.chat, label: "채팅" },
                  ].map(({ icon: Icon, href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-teal-500 transition-colors"
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs">{label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={handleLogoutClick}
                    className="flex flex-col items-center gap-1 p-2 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-6 h-6" />
                    <span className="text-xs">로그아웃</span>
                  </button>
                </div>
              ) : (
                <Button
                  variant="teal"
                  className="w-full"
                  onClick={() => {
                    router.push(ROUTES.login);
                    setIsMobileOpen(false);
                  }}
                >
                  로그인
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="로그아웃 하시겠습니까?"
        confirmLabel="로그아웃"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </header>
  );
}
