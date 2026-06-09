import { Suspense } from "react";

import { getUsedGoodsList } from "@/services/usedGoods/usedGoods";
import { getLikeList } from "@/services/likes";
import { UsedGoodsList } from "@/app/(user)/usedgoods/_components/UsedGoodsList";

export default async function UsedGoodsPage() {
  const [posts, likedIds] = await Promise.all([
    getUsedGoodsList(),
    getLikeList("used_goods"),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="flex-1" />}>
        <UsedGoodsList initialPosts={posts} initialLikedIds={likedIds} />
      </Suspense>
    </div>
  );
}
