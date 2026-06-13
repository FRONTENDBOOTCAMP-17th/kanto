"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";

export function GlobalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTerms = pathname.startsWith("/terms");
  const isLogin = pathname.startsWith("/login");
  const isSignup = pathname.startsWith("/signup");
  const isChat = pathname.startsWith("/chat");

  return (
    <>
      {!isTerms && !isLogin && !isSignup && !isChat && <Header />}
      {!isTerms && !isLogin && !isSignup && !isChat && <ScrollToTop />}
      {children}
      {!isTerms && !isLogin && !isSignup && !isChat && <Footer />}
    </>
  );
}
