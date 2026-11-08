import type { MetadataRoute } from "next";
import { AI_CRAWLER_USER_AGENTS } from "@/constants/crawlers";
import { routing } from "@/i18n/routing";

const PRIVATE_PATHS = [
  "/admin/",
  "/api/",
  "/chat/",
  "/profile/",
  "/favorites/",
  "/notifications/",
  "/myposts/",
  "/create/",
  "/payment/",
  "/go/",
  "/user/",
];

// 기본 로케일(ko)은 접두사가 없고 en/fil은 /en/..., /fil/... 경로를 쓴다.
const LOCALE_PREFIXES = ["", ...routing.locales.filter((l) => l !== routing.defaultLocale).map((l) => `/${l}`)];

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: LOCALE_PREFIXES.flatMap((prefix) =>
          PRIVATE_PATHS.filter((p) => !(prefix && p === "/api/")).map((p) => `${prefix}${p}`),
        ),
      },
      // AI 학습·수집용 크롤러는 사이트 전체 차단 (일반 검색엔진은 위 규칙으로 허용)
      {
        userAgent: [...AI_CRAWLER_USER_AGENTS],
        disallow: "/",
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
