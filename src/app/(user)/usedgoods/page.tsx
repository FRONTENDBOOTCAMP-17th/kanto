import Link from "next/link";

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

  const [posts, likedIds] = await Promise.all([
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
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">중고거래</h1>
        <Link
          href="/usedgoods/create"
          className="inline-flex items-center gap-1 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          + 글쓰기
        </Link>
      </div>

      <UsedGoodsFilters
        defaultSearch={params.search ?? ""}
        defaultCategory={params.category ?? "all"}
        defaultLocation={params.location ?? "all"}
      />

      <div className="border-t border-gray-200 my-6" />

      <UsedGoodsList initialPosts={pagedPosts} initialLikedIds={likedIds} />

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <PaginationUrl currentPage={currentPage} totalPage={totalPages} />
        </div>
      )}
    </main>
  );
}
