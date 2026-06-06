import { Suspense } from "react";

import { getUsedGoodsList } from "@/services/usedGoods";
import { UsedGoodsContent } from "./_components/UsedGoodsList";

import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";

export default async function UsedGoodsPage() {
  const posts = await getUsedGoodsList();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Suspense fallback={<div className="flex-1" />}>
        <UsedGoodsContent initialPosts={posts} />
      </Suspense>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
