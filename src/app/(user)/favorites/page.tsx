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

const CATEGORY_TYPE = ["used_goods", "jobs", "rental"] as const;
type TabType = (typeof CATEGORY_TYPE)[number];

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType: TabType = CATEGORY_TYPE.includes(type as TabType)
    ? (type as TabType)
    : "used_goods";

  const { likedIds, currentUserId } = await getLikeList(activeType);

  if (currentUserId === null) redirect("/login");

  const t = await getTranslations("Favorites");

  const CATEGORY_PATHS: Record<TabType, string> = {
    used_goods: "/usedgoods",
    jobs: "/job",
    rental: "/rental",
  };

  const isEmpty = likedIds.length === 0;

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
                initialPosts={await getUsedGoodsList({ targetIds: likedIds })}
                initialLikedIds={likedIds}
                currentUserId={currentUserId}
              />
            )}
            {activeType === "jobs" && (
              <JobList
                posts={await getJobList({ targetIds: likedIds })}
                likedIds={likedIds}
                currentUserId={currentUserId}
              />
            )}
            {activeType === "rental" && (
              <RentalList
                initialPosts={await getRentalList({ targetIds: likedIds })}
                initialLikedIds={likedIds}
                currentUserId={currentUserId}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
