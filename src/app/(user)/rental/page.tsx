import { Suspense } from "react";

import { getRentalList } from "@/services/rental/rental";
import { getLikeList } from "@/services/likes";
import { RentalList } from "./_components/RentalList";
import { RentalFilters } from "./_components/RentalFilters";
import { PaginationUrl } from "@/components/common/PaginationUrl";

const ITEMS_PER_PAGE = 12;

interface SearchParams {
  search?: string;
  roomType?: string;
  location?: string;
  page?: string;
}

export default async function RentalPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? 1);

  const [posts, likedIds] = await Promise.all([
    getRentalList({
      search: params.search,
      roomType: params.roomType,
      location: params.location,
    }),
    getLikeList("rental"),
  ]);

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const pagedPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <main className="flex-1 bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">방렌트</h1>
          <p className="text-gray-600 mt-1">
            {params.search
              ? `"${params.search}" 검색 결과`
              : "필리핀 한인을 위한 방 렌트 정보"}
          </p>
        </div>

        <Suspense fallback={null}>
          <RentalFilters />
        </Suspense>

        <div className="border-t border-gray-200 mb-8" />

        <Suspense fallback={<div className="flex-1" />}>
          <RentalList initialPosts={pagedPosts} initialLikedIds={likedIds} />
        </Suspense>

        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Suspense fallback={null}>
              <PaginationUrl currentPage={currentPage} totalPage={totalPages} />
            </Suspense>
          </div>
        )}
      </div>
    </main>
  );
}
