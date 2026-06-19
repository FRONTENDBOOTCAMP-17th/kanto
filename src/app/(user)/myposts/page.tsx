import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLikeList } from "@/services/likes";
import { getUsedGoodsList } from "@/services/usedGoods/usedGoods";
import { getJobList } from "@/services/job/job";
import { getRentalList } from "@/services/rental/rental";
import { UsedGoodsList } from "@/app/(user)/usedgoods/_components/UsedGoodsList";
import { JobList } from "@/app/(user)/job/_components/JobList";
import { RentalList } from "@/app/(user)/rental/_components/RentalList";
import { FavoritesTabs } from "@/app/(user)/favorites/_components/FavoritesTabs";
import { PaginationUrl } from "@/components/common/PaginationUrl";
import type { UsedGoodsWithPost } from "@/type/usedGoods";
import type { JobWithPost } from "@/type/job/jobList";
import type { RentalWithPost } from "@/type/rental/rentalList";

const CATEGORY_TYPE = ["used_goods", "jobs", "rental"] as const;
type TabType = (typeof CATEGORY_TYPE)[number];

const ITEMS_PER_PAGE = 12;

export default async function MypostsPage({
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

  let usedGoods: UsedGoodsWithPost[] = [];
  let jobs: JobWithPost[] = [];
  let rentals: RentalWithPost[] = [];
  let totalPages = 1;

  if (activeType === "used_goods") {
    const all = await getUsedGoodsList({ userId: currentUserId });
    totalPages = Math.ceil(all.length / ITEMS_PER_PAGE);
    usedGoods = all.slice(offset, offset + ITEMS_PER_PAGE);
  } else if (activeType === "jobs") {
    const all = await getJobList({ userId: currentUserId });
    totalPages = Math.ceil(all.length / ITEMS_PER_PAGE);
    jobs = all.slice(offset, offset + ITEMS_PER_PAGE);
  } else {
    const all = await getRentalList({ userId: currentUserId });
    totalPages = Math.ceil(all.length / ITEMS_PER_PAGE);
    rentals = all.slice(offset, offset + ITEMS_PER_PAGE);
  }

  return (
    <div className="page-wrapper">
      <main className="flex-1 page-container w-full py-8">
        <h1 className="page-title mb-6">{t("myPostsTitle")}</h1>
        <FavoritesTabs activeType={activeType} tabPath="/myposts" />
        <div className="border-t border-gray-200 my-6" />

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
      </main>
    </div>
  );
}
