import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { getLikeList } from "@/services/likes";
import { getUsedGoodsList } from "@/services/usedGoods/usedGoods";
import { getJobList } from "@/services/job/job";
import { getRentalList } from "@/services/rental/rental";
import { UsedGoodsList } from "@/app/(user)/usedgoods/_components/UsedGoodsList";
import { JobList } from "@/app/(user)/job/_components/JobList";
import { RentalList } from "@/app/(user)/rental/_components/RentalList";
import { FavoritesTabs } from "@/app/(user)/favorites/_components/FavoritesTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { PaginationUrl } from "@/components/common/PaginationUrl";
import type { UsedGoodsWithPost } from "@/type/usedGoods";
import type { JobWithPost } from "@/type/job/jobList";
import type { RentalWithPost } from "@/type/rental/rentalList";

const CATEGORY_TYPE = ["used_goods", "jobs", "rental"] as const;
type TabType = (typeof CATEGORY_TYPE)[number];

const ITEMS_PER_PAGE = 12;

const CREATE_PATHS: Record<TabType, string> = {
  used_goods: "/usedgoods/create",
  jobs: "/job/create",
  rental: "/rental/create",
};

export const metadata: Metadata = {
  robots: { index: false },
};

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

  const { likedIds, currentUserId } = await getLikeList(activeType);
  if (currentUserId === null) redirect("/login");

  const [t, supabase] = await Promise.all([
    getTranslations("Favorites"),
    createClient(),
  ]);

  const countTypes = ["used_goods", "jobs", "rental"] as const;
  const paging = { page: currentPage, pageSize: ITEMS_PER_PAGE };
  const [countResults, postsResult] = await Promise.all([
    Promise.all(
      countTypes.map((postType) =>
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", currentUserId)
          .eq("post_type", postType)
          .eq("status", "active")
          .then(({ count }) => count ?? 0),
      ),
    ),
    (async () => {
      if (activeType === "used_goods") return getUsedGoodsList({ userId: currentUserId }, paging);
      if (activeType === "jobs") return getJobList({ userId: currentUserId }, paging);
      return getRentalList({ userId: currentUserId }, paging);
    })(),
  ]);

  const counts = { used_goods: countResults[0], jobs: countResults[1], rental: countResults[2] };

  let usedGoods: UsedGoodsWithPost[] = [];
  let jobs: JobWithPost[] = [];
  let rentals: RentalWithPost[] = [];
  const totalPages = Math.ceil(postsResult.total / ITEMS_PER_PAGE);

  if (activeType === "used_goods") usedGoods = postsResult.posts as UsedGoodsWithPost[];
  else if (activeType === "jobs") jobs = postsResult.posts as JobWithPost[];
  else rentals = postsResult.posts as RentalWithPost[];

  const isEmpty =
    (activeType === "used_goods" ? usedGoods : activeType === "jobs" ? jobs : rentals).length === 0;

  return (
    <div className="page-wrapper">
      <main className="flex-1 page-container w-full py-8">
        <h1 className="page-title mb-6">{t("myPostsTitle")}</h1>
        <FavoritesTabs activeType={activeType} tabPath="/myposts" counts={counts} />
        <div className="border-t border-gray-200 my-6" />

        {isEmpty ? (
          <EmptyState message={t("myPostsEmpty")} description={t("myPostsEmptyDescription")}>
            <Link
              href={CREATE_PATHS[activeType]}
              className="px-5 py-2.5 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
            >
              {t("writePost")}
            </Link>
          </EmptyState>
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
