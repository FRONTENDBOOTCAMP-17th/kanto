import MainSearchBar from "./_components/MainSearchBar";
import Hero from "./_components/Hero";
import Popular from "./_components/popular/Popular";

export default function MainPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      {/* 검색 섹션 */}
      <section className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-500 text-sm mb-4">
            중고거래 · 구인구직 · 방렌트를 한곳에서
          </p>
          <MainSearchBar />
        </div>
      </section>
      <section className="page-container border-t border-gray-200">
        <Popular />
      </section>
    </div>
  );
}
