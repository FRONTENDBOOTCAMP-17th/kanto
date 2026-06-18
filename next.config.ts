import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      { hostname: "dhvvrtyzurouttlswpbq.supabase.co" },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      { hostname: "k.kakaocdn.net" },
      { hostname: "img1.kakaocdn.net" },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
