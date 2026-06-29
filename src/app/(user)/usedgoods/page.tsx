import { getTranslations } from "next-intl/server";

import { getUsedGoodsList, getUsedGoodsBarangays } from "@/services/usedGoods/usedGoods";
import { getLikeList } from "@/services/likes";
import { getSessionUser, getIdentityVerified } from "@/services/user/user";
import { CategoryWriteButton } from "@/components/common/CategoryWriteButton";
import { UsedGoodsList } from "@/app/(user)/usedgoods/_components/UsedGoodsList";
import { UsedGoodsFilters } from "./_components/UsedGoodsFilters";
import { PaginationUrl } from "@/components/common/PaginationUrl";

const ITEMS_PER_PAGE = 12;

interface SearchParams {
  search?: string;
  category?: string;
  location?: string;
  barangay?: string;
  page?: string;
}

export default async function UsedGoodsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? 1);
  const t = await getTranslations("UsedGoods");

  const [{ posts, total }, { likedIds, currentUserId }, sessionUser, isVerified, barangaysByLocation] =
    await Promise.all([
      getUsedGoodsList(
        {
          search: params.search,
          category: params.category,
          location: params.location,
          barangay: params.barangay,
        },
        { page: currentPage, pageSize: ITEMS_PER_PAGE },
      ),
      getLikeList("used_goods"),
      getSessionUser(),
      getIdentityVerified(),
      getUsedGoodsBarangays(),
    ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="page-wrapper">
      <main className="flex-1 page-container w-full py-8">
        <div className="relative flex flex-col items-center text-center mb-6">
          <h1 className="page-title-lg">{t("title")}</h1>
          <p className="text-gray-600 mt-1">
            {params.search
              ? t("searchResult", { query: params.search })
              : t("subtitle")}
          </p>
          <div className="absolute right-0 top-0">
            <CategoryWriteButton
              href="/usedgoods/create"
              label={t("write")}
              isLoggedIn={!!sessionUser}
              initialIsVerified={isVerified}
            />
          </div>
        </div>

        <UsedGoodsFilters
          givenSearch={params.search ?? ""}
          defaultCategory={params.category ?? "all"}
          defaultLocation={params.location ?? sessionUser?.region ?? "all"}
          defaultBarangay={params.barangay ?? "all"}
          barangaysByLocation={barangaysByLocation}
        />

        <div className="border-t border-gray-200 my-6" />

        <UsedGoodsList
          initialPosts={posts}
          initialLikedIds={likedIds}
          currentUserId={currentUserId}
          currentPage={currentPage}
        />

        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <PaginationUrl currentPage={currentPage} totalPage={totalPages} />
          </div>
        )}
      </main>
    </div>
  );
}
