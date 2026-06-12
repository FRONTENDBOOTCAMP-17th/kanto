"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
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
  Bell,
  MessageCircle,
  Pencil,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "중고거래", icon: ShoppingBag, href: "/usedgoods" },
  { name: "구인구직", icon: Briefcase, href: "/jobs" },
  { name: "방렌트", icon: Home, href: "/rental" },
  { name: "커뮤니티", icon: Users, href: "/community" },
  { name: "랜덤채팅", icon: Heart, href: "/dating" },
];

// SELECT * FROM notifications WHERE user_id = userId ORDER BY created_at DESC  나중에 필요한 쿼리
// Realtime 구독으로 실시간 알림 수신도 필요
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "like",
    title: "좋아요",
    body: "아이폰 15 Pro 게시글에 좋아요가 달렸습니다",
    is_read: false,
    created_at: "방금 전",
  },
  {
    id: 2,
    type: "comment",
    title: "댓글",
    body: "한식당 구인 게시글에 댓글이 달렸습니다",
    is_read: false,
    created_at: "5분 전",
  },
  {
    id: 3,
    type: "chat",
    title: "채팅",
    body: "새로운 채팅 메시지가 도착했습니다",
    is_read: false,
    created_at: "10분 전",
  },
  {
    id: 4,
    type: "like",
    title: "좋아요",
    body: "맥북 M3 게시글에 좋아요가 달렸습니다",
    is_read: true,
    created_at: "1시간 전",
  },
];

const ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  like: { icon: Heart, color: "text-red-400" },
  comment: { icon: FileText, color: "text-blue-400" },
  chat: { icon: MessageCircle, color: "text-teal-400" },
};

export function Header() {
  const router = useRouter();
  const { user, setUser, clearUser } = useAuthStore();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          clearUser();
          return;
        }
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", session.user.id)
          .single();
        if (userData) setUser(userData);
      },
    );
    return () => authListener.subscription.unsubscribe();
  }, [setUser, clearUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  //notification 나중 슈퍼베이스
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  //여기부터
  const handleNotificationClick = (id: number, href?: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setIsNotificationOpen(false);
    // 상세 페이지 연결
    if (href) router.push(href);
  };
  //여기까지 슈베에 교체

  // 여기서부터 알람 읽음표시
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

  const handleLogoutClick = () => {
    handleLogout();
    setIsProfileOpen(false);
    setIsMobileOpen(false);
    router.push("/");
  };
  //여기까지 supabase 교체

  //나중에 fetchNotification useEffect 추가
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setIsProfileOpen(false);
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      )
        setIsNotificationOpen(false);
    };
    if (isProfileOpen || isNotificationOpen)
      document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isProfileOpen, isNotificationOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고  */}
          <Link
            href="/home"
            className="flex items-center hover:opacity-80 transition-opacity shrink-0"
          >
            {/* 모바일 로고 */}
            <Image
              src="/kantoMobileLogo.png"
              alt="kanto"
              width={40}
              height={40}
              className="md:hidden"
            />
            {/* 데스크탑 로고 */}
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
            {/* 글쓰기 — 로그인 + 특정 페이지에서만 표시 */}
            {/* TODO: [Auth] user — Zustand useAuthStore 연결 필요 */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="w-12 h-12"
                onClick={() => router.push("/create")}
              >
                <Pencil className="w-5 h-5 text-gray-700" />
              </Button>
            )}

            {/* 알림 — 로그인 시에만 표시 */}
            {user && (
              <div className="relative hidden md:flex" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative w-12 h-12"
                  onClick={() => {
                    setIsNotificationOpen((v) => !v);
                    setIsProfileOpen(false);
                  }}
                >
                  <Bell className="w-16 h-16 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1/7 min-w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold px-0.5">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {/* 알림 드롭다운 */}
                {isNotificationOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-semibold text-gray-800 text-sm">
                        알림
                      </span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-teal-500 hover:text-teal-600"
                          >
                            모두 읽음
                          </button>
                        )}
                        <Link
                          href="/notifications"
                          onClick={() => setIsNotificationOpen(false)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          전체보기
                        </Link>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-400">
                          알림이 없습니다
                        </p>
                      ) : (
                        // notifications — Supabase 실시간 데이터로 교체 필요
                        notifications.map((n) => {
                          const meta = ICON_MAP[n.type] ?? ICON_MAP.like;
                          const Icon = meta.icon;
                          return (
                            <button
                              key={n.id}
                              onClick={() => handleNotificationClick(n.id)}
                              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors
                                ${!n.is_read ? "bg-teal-50/40" : ""}`}
                            >
                              <Icon
                                className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-700">
                                  {n.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {n.body}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {n.created_at}
                                </p>
                              </div>
                              {!n.is_read && (
                                <span className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 프로필 드롭다운 — 데스크탑 */}
            {user ? (
              <div className="relative hidden md:block" ref={profileRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12"
                  onClick={() => {
                    setIsProfileOpen((v) => !v);
                    setIsNotificationOpen(false);
                  }}
                >
                  {/*user 연결 후 실제 프로필 이미지(user.avatar_url) 로 교체 */}
                  <div className="w-9 h-9 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </Button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-12 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {[
                      { label: "내 정보", icon: Settings, href: "/my-profile" },
                      { label: "찜 목록", icon: ThumbsUp, href: "/favorites" },
                      { label: "내 게시글", icon: FileText, href: "/my-posts" },
                      {
                        label: "채팅 목록",
                        icon: MessageCircle,
                        href: "/chat",
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
                onClick={() => router.push("/login")}
              >
                로그인
              </Button>
            )}

            {/* 모바일 알림 버튼 */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden relative w-12 h-12"
                onClick={() => router.push("/notifications")}
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1/7 min-w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold px-0.5">
                    {unreadCount}
                  </span>
                )}
              </Button>
            )}

            {/* 모바일 햄버거 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-12 h-12"
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
                    { icon: User, href: "/my-profile", label: "내 정보" },
                    { icon: Heart, href: "/favorites", label: "찜" },
                    { icon: FileText, href: "/my-posts", label: "내 글" },
                    { icon: MessageCircle, href: "/chat", label: "채팅" },
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
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                  onClick={() => {
                    router.push("/login");
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
    </header>
  );
}
