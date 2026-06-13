"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/type/user";
import { DeletionPendingBanner } from "@/components/common/DeletionPendingBanner";

interface Props {
  children: React.ReactNode;
  initialUser: User | null;
}

export function GlobalLayout({ children, initialUser }: Props) {
  const pathname = usePathname();

  // 서버에서 읽은 유저를 렌더 시점에 동기적으로 스토어에 주입 — useEffect보다 먼저 실행되어 flash 방지
  const initialized = useRef<true | null>(null);
  if (initialized.current == null) {
    initialized.current = true;
    if (initialUser) useAuthStore.setState({ user: initialUser, isLoggedIn: true });
  }
  const isTerms = pathname.startsWith("/terms");
  const isLogin = pathname.startsWith("/login");
  const isSignup = pathname.startsWith("/signup");
  const isChat = pathname.startsWith("/chat");

  return (
    <div className="min-h-screen flex flex-col">
      {!isTerms && !isLogin && !isSignup && <Header />}
      {!isTerms && !isLogin && !isSignup && <DeletionPendingBanner />}
      {!isTerms && !isLogin && !isSignup && <ScrollToTop />}
      <main className="flex-1">{children}</main>
      {!isTerms && !isLogin && !isSignup && <Footer />}
    </div>
  );
}
