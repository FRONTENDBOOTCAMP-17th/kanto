import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getLikeList } from "@/services/likes";
import { getUsedGoodsList } from "@/services/usedGoods/usedGoods";
import { getJobList } from "@/services/job/job";
import { getRentalList } from "@/services/rental/rental";
import { UsedGoodsList } from "@/app/(user)/usedgoods/_components/UsedGoodsList";
import { JobList } from "@/app/(user)/job/_components/JobList";
import { RentalList } from "@/app/(user)/rental/_components/RentalList";
import { FavoritesTabs } from "./_components/FavoritesTabs";
import { PaginationUrl } from "@/components/common/PaginationUrl";
import type { UsedGoodsWithPost } from "@/type/usedGoods";
import type { JobWithPost } from "@/type/job/jobList";
import type { RentalWithPost } from "@/type/rental/rentalList";

const CATEGORY_TYPE = ["used_goods", "jobs", "rental"] as const;
type TabType = (typeof CATEGORY_TYPE)[number];

const ITEMS_PER_PAGE = 12;

const CATEGORY_PATHS: Record<TabType, string> = {
  used_goods: "/usedgoods",
  jobs: "/job",
  rental: "/rental",
};

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const { type, page } = await searchParams;
  const activeType: TabType = CATEGORY_TYPE.includes(type as TabType)
    ? (type as TabType)
    : "used_goods";
  const currentPage = Number(page ?? 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { likedIds, currentUserId } = await getLikeList(activeType);
  if (currentUserId === null) redirect("/login");

  const t = await getTranslations("Favorites");
  const isEmpty = likedIds.length === 0;

  let usedGoods: UsedGoodsWithPost[] = [];
  let jobs: JobWithPost[] = [];
  let rentals: RentalWithPost[] = [];
  let totalPages = 1;

  if (!isEmpty) {
    if (activeType === "used_goods") {
      const all = await getUsedGoodsList({ targetIds: likedIds });
      totalPages = Math.ceil(all.length / ITEMS_PER_PAGE);
      usedGoods = all.slice(offset, offset + ITEMS_PER_PAGE);
    } else if (activeType === "jobs") {
      const all = await getJobList({ targetIds: likedIds });
      totalPages = Math.ceil(all.length / ITEMS_PER_PAGE);
      jobs = all.slice(offset, offset + ITEMS_PER_PAGE);
    } else {
      const all = await getRentalList({ targetIds: likedIds });
      totalPages = Math.ceil(all.length / ITEMS_PER_PAGE);
      rentals = all.slice(offset, offset + ITEMS_PER_PAGE);
    }
  }

  return (
    <div className="page-wrapper">
      <main className="flex-1 page-container w-full py-8">
        <h1 className="page-title mb-6">{t("title")}</h1>
        <FavoritesTabs activeType={activeType} tabPath="/favorites" />
        <div className="border-t border-gray-200 my-6" />

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <p className="text-gray-500 text-base">{t("empty")}</p>
            <Link
              href={CATEGORY_PATHS[activeType]}
              className="px-5 py-2.5 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
            >
              {t(`goTo.${activeType}`)}
            </Link>
          </div>
        ) : (
          <>
            {activeType === "used_goods" && (
              <UsedGoodsList
                initialPosts={usedGoods}
                initialLikedIds={likedIds}
                currentUserId={currentUserId}
                currentPage={currentPage}
              />
            )}
            {activeType === "jobs" && (
              <JobList
                posts={jobs}
                likedIds={likedIds}
                currentUserId={currentUserId}
                currentPage={currentPage}
              />
            )}
            {activeType === "rental" && (
              <RentalList
                initialPosts={rentals}
                initialLikedIds={likedIds}
                currentUserId={currentUserId}
                currentPage={currentPage}
              />
            )}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <PaginationUrl currentPage={currentPage} totalPage={totalPages} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
