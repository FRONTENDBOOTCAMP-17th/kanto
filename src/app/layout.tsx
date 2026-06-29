import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { GlobalLayout } from "@/components/common/GlobalLayout";
import { Providers } from "@/components/common/Providers";
import { getSessionUser } from "@/services/user/user";
import { BCP47_LOCALE, type Locale } from "@/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "칸토 | 필리핀 한인 중고거래 & 렌탈 플랫폼",
    template: "%s | 칸토",
  },
  description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼입니다.",
  keywords: ["칸토", "필리핀 한인", "중고거래", "렌탈", "구인구직"],
  authors: [{ name: "칸토" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "칸토",
    title: "칸토 | 필리핀 한인 중고거래 & 렌탈 플랫폼",
    description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼입니다.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "칸토 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "칸토 | 필리핀 한인 중고거래 & 렌탈 플랫폼",
    description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼입니다.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  appleWebApp: {
    capable: true,
    title: "Kanto",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getSessionUser();
  const locale = (await getLocale()) as Locale;

  return (
    <html
      lang={BCP47_LOCALE[locale]}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "칸토",
              url: BASE_URL,
              logo: `${BASE_URL}/kantoLogo.png`,
              sameAs: [],
            }),
          }}
        />
        {/* 하이드레이션 전에 실행: 새로고침으로 채팅 오버레이가 복원될 상황이면
            모바일에서 흰 커버(globals.css)를 깔아 밑 페이지 깜빡임을 막는다.
            'chatWidget:newChatDraft' 키는 FloatingChatWidget의 NEW_CHAT_DRAFT_KEY와 일치시켜야 한다. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(innerWidth<768){var c=new URLSearchParams(location.search).get('chat');if(c||sessionStorage.getItem('chatWidget:newChatDraft'))document.documentElement.setAttribute('data-chat-boot','')}}catch(e){}`,
          }}
        />
        <NextIntlClientProvider>
          <Providers>
            <GlobalLayout initialUser={initialUser}>{children}</GlobalLayout>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
