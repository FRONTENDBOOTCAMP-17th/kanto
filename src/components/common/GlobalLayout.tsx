"use client";

import { useRef } from "react";
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

export function GlobalLayout({ children, initialUser }: Props) {
  const pathname = usePathname();

  const initialized = useRef<true | null>(null);
  if (initialized.current == null) {
    initialized.current = true;
    if (initialUser) useAuthStore.setState({ user: initialUser, isLoggedIn: true });
  }
  const isTerms = pathname.startsWith("/terms");
  const isLogin = pathname.startsWith("/login");
  const isSignup = pathname.startsWith("/signup");
  const isAdmin = pathname.startsWith("/admin");
  const isGo = pathname.startsWith("/go");

  const hideGlobalUI = isTerms || isLogin || isSignup || isAdmin;

  return (
    <div className="min-h-screen flex flex-col">
      {!hideGlobalUI && <Header initialUser={initialUser} />}
      {!hideGlobalUI && <div className="h-12 md:h-0" aria-hidden="true" />}
      {!hideGlobalUI && <DeletionPendingBanner />}
      {!hideGlobalUI && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          <ScrollToTop />
          <FloatingChatWidget />
        </div>
      )}
      <SuspendedModal />
      <main className="flex-1">{children}</main>
      {!hideGlobalUI && !isGo && <Footer />}
    </div>
  );
}
