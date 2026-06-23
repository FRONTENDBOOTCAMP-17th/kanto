"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/type/user";
import { DeletionPendingBanner } from "@/components/common/DeletionPendingBanner";
import { SuspendedModal } from "@/components/common/SuspendedModal";
import FloatingChatWidget from "@/components/common/chat/FloatingChatWidget";

interface Props {
  children: React.ReactNode;
  initialUser: User | null;
}

// useLayoutEffect는 SSR에서 경고를 내므로 클라이언트에서만 사용한다.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function GlobalLayout({ children, initialUser }: Props) {
  const pathname = usePathname();

  // 부팅 커버(layout.tsx 인라인 스크립트가 깔아둔 흰 화면)를 마운트 시 제거한다.
  // 위젯이 없는 페이지(로그인 등)에서도 항상 마운트되는 GlobalLayout에서 지워야
  // 커버가 남아 흰 화면이 되는 일이 없다. 위젯 오버레이는 자식인
  // FloatingChatWidget의 layout effect에서 같은 페인트 전에 열리므로 깜빡임이 없다.
  useIsoLayoutEffect(() => {
    document.documentElement.removeAttribute("data-chat-boot");
  }, []);

  const initialized = useRef<true | null>(null);
  if (initialized.current == null) {
    initialized.current = true;
    if (initialUser) useAuthStore.setState({ user: initialUser, isLoggedIn: true });
  }
  const isTerms = pathname.startsWith("/terms");
  const isLogin = pathname.startsWith("/login");
  const isSignup = pathname.startsWith("/signup");
  const isAdmin = pathname.startsWith("/admin");

  const hideGlobalUI = isTerms || isLogin || isSignup || isAdmin;

  return (
    <div className="min-h-screen flex flex-col">
      {!hideGlobalUI && <Header initialUser={initialUser} />}
      {!hideGlobalUI && <div className="h-12 md:h-0" aria-hidden="true" />}
      {!hideGlobalUI && <DeletionPendingBanner />}
      {!hideGlobalUI && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          <ScrollToTop />
          <FloatingChatWidget initialUser={initialUser} />
        </div>
      )}
      <SuspendedModal />
      <main className="flex-1">{children}</main>
      {!hideGlobalUI && <Footer />}
    </div>
  );
}
