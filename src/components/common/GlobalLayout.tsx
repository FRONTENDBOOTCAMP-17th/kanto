"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ScrollContext } from "@/contexts/ScrollContext";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { useChatStore } from "@/store/chatStore";
import { useGoUiStore } from "@/store/goUiStore";
import type { PublicNotice } from "@/services/admin/adminNotices";
import { DeletionPendingBanner } from "@/components/common/DeletionPendingBanner";
import { SuspendedModal } from "@/components/common/SuspendedModal";
import FloatingChatWidget from "@/components/common/chat/FloatingChatWidget";
import Chatbot from "@/components/common/aichatbot/Chatbot"

interface Props {
  children: React.ReactNode;
  initialNotices: PublicNotice[];
}

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function GlobalLayout({ children, initialNotices }: Props) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);
  
  
  const [botOpen, setBotOpen] = useState(false);
  const chatOpen = useChatStore((s) => s.isOpen);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  
  
  
  const goDetailOpen = useGoUiStore((s) => s.detailOpen);
  const goListOpen = useGoUiStore((s) => s.listOpen);
  const hasStickyBar = useGoUiStore((s) => s.hasStickyBar);

  
  useEffect(() => {
    return useChatStore.subscribe((state) => {
      if (state.isOpen) setBotOpen(false);
    });
  }, []);

  
  
  
  
  useIsoLayoutEffect(() => {
    document.documentElement.removeAttribute("data-chat-boot");
  }, []);

  const isTerms = pathname.startsWith("/terms");
  const isLogin = pathname.startsWith("/login");
  const isSignup = pathname.startsWith("/signup");
  const isAdmin = pathname.startsWith("/admin");
  const isGo = pathname.startsWith("/go");

  const hideGlobalUI = isTerms || isLogin || isSignup || isAdmin;

  return (
    <ScrollContext.Provider value={scrollRef}>
      <div
        ref={scrollRef}
        id="scroll-root"
        className={`h-full flex flex-col ${isGo ? "overflow-hidden" : "overflow-y-auto"}`}
        style={isGo ? undefined : { scrollbarGutter: "stable" }}
      >
        {!hideGlobalUI && <Header initialNotices={initialNotices} />}
        {!hideGlobalUI && <div className="h-12 md:h-0 shrink-0" aria-hidden="true" />}
        {!hideGlobalUI && <DeletionPendingBanner />}
        {!hideGlobalUI && (
          <div
            className={`fixed z-50 flex flex-col items-end gap-2 ${hasStickyBar ? "bottom-20 right-4 md:bottom-6 md:right-6" : "bottom-6 right-6"} ${
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
            <FloatingChatWidget />
          </div>
        )}
        <SuspendedModal />
        <main className="flex-1">{children}</main>
        {!hideGlobalUI && !isGo && <Footer />}
      </div>
    </ScrollContext.Provider>
  );
}
