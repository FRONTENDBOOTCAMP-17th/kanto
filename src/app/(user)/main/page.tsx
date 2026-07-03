import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "홈",
  description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼 칸토입니다.",
  openGraph: {
    title: "칸토 | 필리핀 한인 중고거래 & 렌탈 플랫폼",
    description: "필리핀 한인 커뮤니티를 위한 중고거래, 렌탈, 구인구직 플랫폼 칸토입니다.",
    images: [{ url: "/kantoLogo.png", alt: "칸토 로고" }],
  },
};
import MainSearchBar from "./_components/MainSearchBar";
import Hero from "./_components/Hero";
import Popular from "./_components/popular/Popular";
import GoPreview from "./_components/GoPreview";
import { getActiveMeetups } from "@/services/go/go";

export default async function MainPage() {
  const t = await getTranslations("Main");
  const meetups = await getActiveMeetups().catch(() => []);
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
