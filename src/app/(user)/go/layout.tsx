import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "칸토 Go! | 필리핀 한인 번개 모임",
  description: "필리핀 한인 커뮤니티의 실시간 번개 모임을 지도에서 확인하세요.",
  openGraph: {
    title: "칸토 Go! | 필리핀 한인 번개 모임",
    description: "필리핀 한인 커뮤니티의 실시간 번개 모임을 지도에서 확인하세요.",
    type: "website",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/go`,
  },
};

export default function GoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
