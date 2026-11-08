import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: { absolute: "칸토 - 필리핀 정보 플랫폼" },
  description:
    "필리핀 정보 - 채팅, 중고거래, 부동산, 구인구직, 모임 등 생활에 필요한 모든 정보를 보다 편리하게 제공하는 플랫폼을 이용해보세요.",
  openGraph: {
    title: "칸토 - 필리핀 정보 플랫폼",
    description:
      "필리핀 정보 - 채팅, 중고거래, 부동산, 구인구직, 모임 등 생활에 필요한 모든 정보를 보다 편리하게 제공하는 플랫폼을 이용해보세요.",
    images: [{ url: "/kantoLogo.png", alt: "칸토 로고" }],
  },
};
import MainSearchBar from "./_components/MainSearchBar";
import Hero from "./_components/Hero";
import Popular from "./_components/popular/Popular";
import GoPreview from "./_components/GoPreview";
import { queryActiveMeetups } from "@/services/go/activeMeetups";
import { createPublicClient } from "@/utils/supabase/public";

// 요청 데이터(쿠키)를 읽지 않으므로 1분 단위 ISR로 캐시한다. 좋아요 여부 등 사용자별 상태는 클라이언트에서 채운다.
export const revalidate = 60;

export default async function MainPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Main");
  const meetups = await queryActiveMeetups(createPublicClient()).catch(() => []);
  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      <section className="bg-gray-50 py-8">
        <div className="page-container">
          <p className="text-center text-gray-500 text-sm mb-4">
            {t("tagline")}
          </p>
          <MainSearchBar />
        </div>
      </section>
      <GoPreview meetups={meetups} />
      <section className="page-container border-t border-gray-200 pb-12">
        <Popular />
      </section>
    </div>
  );
}
