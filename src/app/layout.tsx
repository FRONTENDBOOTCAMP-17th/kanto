import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { GlobalLayout } from "@/components/common/GlobalLayout";
import { Providers } from "@/components/common/Providers";
import { WebVitalsReporter } from "@/components/common/WebVitalsReporter";
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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!.replace(/\/$/, "");

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
  },
  twitter: {
    card: "summary_large_image",
    title: "칸토 | 필리핀 한인 중고거래 & 렌탈 플랫폼",
    description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼입니다.",
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
  const messages = await getMessages();

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
        
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(innerWidth<768){var c=new URLSearchParams(location.search).get('chat');if(c||sessionStorage.getItem('chatWidget:newChatDraft'))document.documentElement.setAttribute('data-chat-boot','')}}catch(e){}`,
          }}
        />
        <WebVitalsReporter />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <GlobalLayout initialUser={initialUser}>{children}</GlobalLayout>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
