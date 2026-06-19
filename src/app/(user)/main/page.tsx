import { useTranslations } from "next-intl";
import MainSearchBar from "./_components/MainSearchBar";
import Hero from "./_components/Hero";
import Popular from "./_components/popular/Popular";

export default function MainPage() {
  const t = useTranslations("Main");
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
      <section className="page-container border-t border-gray-200 pb-12">
        <Popular />
      </section>
    </div>
  );
}
