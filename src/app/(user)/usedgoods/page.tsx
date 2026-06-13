import { WriteButton } from "@/components/common/WriteButton";

import { getUsedGoodsList } from "@/services/usedGoods/usedGoods";
import { getLikeList } from "@/services/likes";
import { UsedGoodsList } from "@/app/(user)/usedgoods/_components/UsedGoodsList";
import { UsedGoodsFilters } from "./_components/UsedGoodsFilters";
import { PaginationUrl } from "@/components/common/PaginationUrl";

const ITEMS_PER_PAGE = 12;

interface SearchParams {
  search?: string;
  category?: string;
  location?: string;
  page?: string;
}

export default async function UsedGoodsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? 1);

  const [posts, { likedIds, currentUserId }] = await Promise.all([
    getUsedGoodsList({
      search: params.search,
      category: params.category,
      location: params.location,
    }),
    getLikeList("used_goods"),
  ]);

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const pagedPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="page-wrapper">
      <main className="flex-1 page-container w-full py-8">
      <div className="section-header">
        <h1 className="page-title">중고거래</h1>
          <WriteButton href="/usedgoods/create" label="글쓰기" />
      </div>

      <UsedGoodsFilters
        defaultSearch={params.search ?? ""}
        defaultCategory={params.category ?? "all"}
        defaultLocation={params.location ?? "all"}
      />

      <div className="border-t border-gray-200 my-6" />

      <UsedGoodsList initialPosts={pagedPosts} initialLikedIds={likedIds} currentUserId={currentUserId} />

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <PaginationUrl currentPage={currentPage} totalPage={totalPages} />
        </div>
      )}
      </main>
    </div>
  );
}
