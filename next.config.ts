import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { hostname: "dhvvrtyzurouttlswpbq.supabase.co" },
    ],
  },
};

export default nextConfig;
