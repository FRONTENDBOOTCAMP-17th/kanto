"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useGoUiStore } from "@/store/goUiStore";
import type { User } from "@/type/user";
import { DeletionPendingBanner } from "@/components/common/DeletionPendingBanner";
import { SuspendedModal } from "@/components/common/SuspendedModal";
import FloatingChatWidget from "@/components/common/chat/FloatingChatWidget";
import Chatbot from "@/components/common/aichatbot/Chatbot"

interface Props {
  children: React.ReactNode;
  initialUser: User | null;
}

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function GlobalLayout({ children, initialUser }: Props) {
  const pathname = usePathname();
  
  
  const [botOpen, setBotOpen] = useState(false);
  const chatOpen = useChatStore((s) => s.isOpen);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  
  
  
  const goDetailOpen = useGoUiStore((s) => s.detailOpen);
  const goListOpen = useGoUiStore((s) => s.listOpen);

  
  useEffect(() => {
    return useChatStore.subscribe((state) => {
      if (state.isOpen) setBotOpen(false);
    });
  }, []);

  
  
  
  
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
  const isGo = pathname.startsWith("/go");

  const hideGlobalUI = isTerms || isLogin || isSignup || isAdmin;

  return (
    <div className="min-h-screen flex flex-col">
      {!hideGlobalUI && <Header initialUser={initialUser} />}
      {!hideGlobalUI && <div className="h-12 md:h-0" aria-hidden="true" />}
      {!hideGlobalUI && <DeletionPendingBanner />}
      {!hideGlobalUI && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 ${
            goDetailOpen ? "hidden" : goListOpen ? "max-md:hidden" : ""
          }`}
        >
          
          {!isGo && <ScrollToTop />}
          <Chatbot
            isOpen={botOpen}
            onToggle={() => {
              const next = !botOpen;
              setBotOpen(next);
              if (next) setWidgetOpen(false); 
            }}
            mobileHidden={chatOpen}
          />
          <FloatingChatWidget initialUser={initialUser} />
        </div>
      )}
      <SuspendedModal />
      <main className="flex-1">{children}</main>
      {!hideGlobalUI && !isGo && <Footer />}
    </div>
  );
}
