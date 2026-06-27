import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "칸토 - 필리핀 한인 플랫폼",
    short_name: "칸토",
    description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼",
    start_url: "/main",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#E85D04",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
  };
}
