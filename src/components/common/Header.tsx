"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  Settings,
  ThumbsUp,
  FileText,
  LogOut,
  SquarePen,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { SuspendedBanner } from "@/components/common/SuspendedBanner";
import { NotificationBell } from "./header/NotificationBell";
import type { NotificationBellHandle } from "./header/NotificationBell";
import type { User as AppUser } from "@/type/user";
import { useTranslations } from "next-intl";

const HEADER_HEIGHT = 48; // 모바일 헤더 높이(h-12)

const NAV_ITEMS = [
  { key: "usedgoods", icon: ShoppingBag, href: ROUTES.usedgoods },
  { key: "jobs", icon: Briefcase, href: ROUTES.jobs },
  { key: "rental", icon: Home, href: ROUTES.rental },
] as const;

export function Header({ initialUser }: { initialUser: AppUser | null }) {
  const t = useTranslations("Header");
  const router = useRouter();
  // 서버에서 확정된 initialUser를 첫 렌더(SSR 포함) fallback으로 사용해 깜빡임 제거.
  // 이후 스토어가 갱신되면(아바타 변경 등) 스토어 값을 따른다.
  const user = useAuthStore((s) => s.user) ?? initialUser;
  useAuthInit();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationBellRef = useRef<NotificationBellHandle>(null);
  const prevScrollY = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= HEADER_HEIGHT) {
        setIsVisible(true); // 최상단 부근
      } else if (currentScrollY > prevScrollY.current) {
        setIsVisible(false); // 아래로 스크롤
      } else if (currentScrollY < prevScrollY.current) {
        setIsVisible(true); // 위로 스크롤
      }
      prevScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
    setIsProfileOpen(false);
    setIsMobileOpen(false);
  };

  const pathname = usePathname();
  const PROTECTED_PATHS = ["/create", "/myposts", "/favorites", "/profile"];

  const handleLogoutConfirm = async () => {
    setIsLogoutModalOpen(false);
    await supabase.auth.signOut();
    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
    if (isProtected) {
      router.push(ROUTES.login);
    } else {
      router.refresh();
    }
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
    <header
      className={`fixed md:sticky top-0 z-50 w-full bg-white border-b border-gray-200 transition-transform duration-300 ${
        isVisible || isMobileOpen ? "translate-y-0" : "-translate-y-full md:translate-y-0"
      }`}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-12 md:h-16">
          {/* 로고 */}
          <Link
            href={ROUTES.home}
            className="flex items-center hover:opacity-80 transition-opacity shrink-0"
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
              height={56}
              className="hidden md:block"
            />
          </Link>

          <div className="flex-1" />

          {/* 우측 액션 버튼 */}
          <div className="flex items-center shrink-0">
            {/* 언어 전환 */}
            <LanguageSwitcher />

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
                  aria-label={t("profile.menuLabel")}
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
                      alt={user.name ?? t("profile.alt")}
                      width={36}
                      height={36}
                      priority
                      unoptimized
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
                        label: t("profile.myInfo"),
                        icon: Settings,
                        href: ROUTES.myProfile,
                      },
                      {
                        label: t("profile.favorites"),
                        icon: ThumbsUp,
                        href: ROUTES.favorites,
                      },
                      {
                        label: t("profile.myPosts"),
                        icon: FileText,
                        href: ROUTES.myPosts,
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
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                className="hidden md:flex bg-teal-500 hover:bg-teal-600 text-white"
                onClick={() => router.push(ROUTES.login)}
              >
                {t("login")}
              </Button>
            )}

            {/* 모바일 햄버거 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-10 h-10"
              aria-label={isMobileOpen ? t("closeMenu") : t("openMenu")}
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

        {/* 데스크탑 네비게이션 */}
        <nav className="relative hidden md:flex items-center justify-center gap-1 border-t border-gray-100 py-1">
          {NAV_ITEMS.map(({ key, icon: Icon, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-teal-500 hover:bg-teal-50 rounded-lg transition-colors font-medium"
            >
              <Icon className="w-4 h-4" />
              {t(`nav.${key}`)}
            </Link>
          ))}
          {/* 글쓰기 버튼 — 메인 페이지에서만 노출 (모바일에서는 nav 자체가 숨겨짐) */}
          {pathname === ROUTES.home && (
            <Link
              href={ROUTES.create}
              className="absolute right-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
            >
              <SquarePen className="w-4 h-4" />
              {t("write")}
            </Link>
          )}
        </nav>

        {/* 모바일 메뉴 */}
        {isMobileOpen && (
          <div className="md:hidden border-t border-gray-200 py-3">
            <nav className="space-y-0.5">
              {NAV_ITEMS.map(({ key, icon: Icon, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-500 rounded-lg transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{t(`nav.${key}`)}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-3 px-4 pt-3 border-t border-gray-100">
              {user ? (
                <div className="flex items-center justify-around">
                  {[
                    {
                      icon: User,
                      href: ROUTES.myProfile,
                      label: t("profile.myInfo"),
                    },
                    {
                      icon: Heart,
                      href: ROUTES.favorites,
                      label: t("profile.favoritesShort"),
                    },
                    {
                      icon: FileText,
                      href: ROUTES.myPosts,
                      label: t("profile.myPostsShort"),
                    },
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
                    <span className="text-xs">{t("logout")}</span>
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
                  {t("login")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <SuspendedBanner />
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title={t("logoutConfirm")}
        confirmLabel={t("logout")}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </header>
  );
}
