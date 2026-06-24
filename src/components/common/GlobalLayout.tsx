"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import type { User } from "@/type/user";
import { DeletionPendingBanner } from "@/components/common/DeletionPendingBanner";
import { SuspendedModal } from "@/components/common/SuspendedModal";
import FloatingChatWidget from "@/components/common/chat/FloatingChatWidget";
import Chatbot from "@/components/common/aichatbot/Chatbot"

interface Props {
  children: React.ReactNode;
  initialUser: User | null;
}

// useLayoutEffect는 SSR에서 경고를 내므로 클라이언트에서만 사용한다.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function GlobalLayout({ children, initialUser }: Props) {
  const pathname = usePathname();
  // 채팅 위젯의 열림 상태는 chatStore가 소스 오브 트루스이고(복원 로직이 의존),
  // GlobalLayout은 AI 챗봇 열림 상태만 들고 둘이 동시에 열리지 않게 조정한다.
  const [botOpen, setBotOpen] = useState(false);
  const chatOpen = useChatStore((s) => s.isOpen);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);

  // 채팅 위젯이 열리면 챗봇을 닫는다(챗봇을 열 때 채팅을 닫는 건 onToggle에서 처리).
  useEffect(() => {
    return useChatStore.subscribe((state) => {
      if (state.isOpen) setBotOpen(false);
    });
  }, []);

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
          <Chatbot
            isOpen={botOpen}
            onToggle={() => {
              const next = !botOpen;
              setBotOpen(next);
              if (next) setWidgetOpen(false); // 챗봇을 열 때 채팅 위젯을 닫는다.
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
