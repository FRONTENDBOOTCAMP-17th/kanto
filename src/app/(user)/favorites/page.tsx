import type { Metadata } from "next";
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
import { EmptyState } from "@/components/common/EmptyState";
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

export const metadata: Metadata = {
  robots: { index: false },
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

  const { likedIds, currentUserId } = await getLikeList(activeType);
  if (currentUserId === null) redirect("/login");

  const t = await getTranslations("Favorites");

  let usedGoods: UsedGoodsWithPost[] = [];
  let jobs: JobWithPost[] = [];
  let rentals: RentalWithPost[] = [];
  let totalPages = 1;

  if (likedIds.length > 0) {
    const paging = { page: currentPage, pageSize: ITEMS_PER_PAGE };
    if (activeType === "used_goods") {
      const { posts, total } = await getUsedGoodsList({ targetIds: likedIds }, paging);
      totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      usedGoods = posts;
    } else if (activeType === "jobs") {
      const { posts, total } = await getJobList({ targetIds: likedIds }, paging);
      totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      jobs = posts;
    } else {
      const { posts, total } = await getRentalList({ targetIds: likedIds }, paging);
      totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      rentals = posts;
    }
  }

  // 실제로 표시할 게시글 기준으로 빈 화면을 판정한다(찜했지만 삭제/비활성으로
  // 목록에 안 잡히는 경우에도 모든 탭에서 동일한 빈 화면+버튼이 뜨도록).
  const isEmpty =
    (activeType === "used_goods" ? usedGoods : activeType === "jobs" ? jobs : rentals).length === 0;

  return (
    <div className="page-wrapper">
      <main className="flex-1 page-container w-full py-8">
        <h1 className="page-title mb-6">{t("title")}</h1>
        <FavoritesTabs activeType={activeType} tabPath="/favorites" />
        <div className="border-t border-gray-200 my-6" />

        {isEmpty ? (
          <EmptyState message={t("empty")} description={t("emptyDescription")}>
            <Link
              href={CATEGORY_PATHS[activeType]}
              className="px-5 py-2.5 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
            >
              {t(`goTo.${activeType}`)}
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
