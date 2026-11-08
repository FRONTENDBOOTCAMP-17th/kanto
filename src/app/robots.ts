import type { MetadataRoute } from "next";
import { AI_CRAWLER_USER_AGENTS } from "@/constants/crawlers";

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
        ],
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
