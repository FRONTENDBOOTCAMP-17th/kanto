import { Suspense } from "react";

import { getUsedGoodsList } from "@/services/usedGoods/usedGoods";
import { getLikeList } from "@/services/likes";
import { UsedGoodsList } from "@/app/(user)/usedgoods/_components/UsedGoodsList";

import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";

export default async function UsedGoodsPage() {
  const [posts, likedIds] = await Promise.all([
    getUsedGoodsList(),
    getLikeList("used_goods"),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Suspense fallback={<div className="flex-1" />}>
        <UsedGoodsList initialPosts={posts} initialLikedIds={likedIds} />
      </Suspense>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
