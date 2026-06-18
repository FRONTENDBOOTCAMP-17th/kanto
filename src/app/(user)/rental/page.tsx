import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getRentalList } from "@/services/rental/rental";
import { getLikeList } from "@/services/likes";
import { getSessionUser } from "@/services/user/user";
import { RentalList } from "./_components/RentalList";
import { RentalFilters } from "./_components/RentalFilters";
import { PaginationUrl } from "@/components/common/PaginationUrl";
import { Button } from "@/components/ui/button";

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
  const t = await getTranslations("Rental");

  const [posts, { likedIds, currentUserId }, sessionUser] = await Promise.all([
    getRentalList({
      search: params.search,
      roomType: params.roomType,
      location: params.location,
    }),
    getLikeList("rental"),
    getSessionUser(),
  ]);

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const pagedPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <main className="flex-1 bg-gray-50 py-8">
      <div className="page-container">
        <div className="relative flex flex-col items-center text-center mb-6">
          <h1 className="page-title-lg">{t("title")}</h1>
          <p className="text-gray-600 mt-1">
            {params.search
              ? t("searchResult", { query: params.search })
              : t("subtitle")}
          </p>
          <Link href="/create" className="absolute right-0 top-0">
            <Button variant="teal" className="cursor-pointer gap-1">
              <Plus className="w-4 h-4" />
              {t("write")}
            </Button>
          </Link>
        </div>

        <RentalFilters
          givenSearch={params.search ?? ""}
          defaultRoomType={params.roomType ?? "all"}
          defaultLocation={params.location ?? sessionUser?.region ?? "all"}
        />

        <div className="border-t border-gray-200 mb-8" />

        <RentalList
          initialPosts={pagedPosts}
          initialLikedIds={likedIds}
          currentUserId={currentUserId}
        />

        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <PaginationUrl currentPage={currentPage} totalPage={totalPages} />
          </div>
        )}
      </div>
    </main>
  );
}
