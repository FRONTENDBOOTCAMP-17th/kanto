import { redirect } from "next/navigation";
import { getLikeList } from "@/services/likes";
import { getUsedGoodsList } from "@/services/usedGoods/usedGoods";
import { getJobList } from "@/services/job/job";
import { getRentalList } from "@/services/rental/rental";
import { UsedGoodsList } from "@/app/(user)/usedgoods/_components/UsedGoodsList";
import { JobList } from "@/app/(user)/job/_components/JobList";
import { RentalList } from "@/app/(user)/rental/_components/RentalList";
import { FavoritesTabs } from "@/app/(user)/favorites/_components/FavoritesTabs";

const CATEGORY_TYPE = ["used_goods", "jobs", "rental"] as const;
type TabType = (typeof CATEGORY_TYPE)[number];

export default async function MypostsPage({
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

  return (
    <div className="page-wrapper">
      <main className="flex-1 page-container w-full py-8">
        <h1 className="page-title mb-6">내 게시글</h1>
        <FavoritesTabs activeType={activeType} tabPath="/myposts" />
        <div className="border-t border-gray-200 my-6" />

        {activeType === "used_goods" && (
          <UsedGoodsList
            initialPosts={await getUsedGoodsList({ userId: currentUserId })}
            initialLikedIds={likedIds}
            currentUserId={currentUserId}
          />
        )}
        {activeType === "jobs" && (
          <JobList
            posts={await getJobList({ userId: currentUserId })}
            likedIds={likedIds}
            currentUserId={currentUserId}
          />
        )}
        {activeType === "rental" && (
          <RentalList
            initialPosts={await getRentalList({ userId: currentUserId })}
            initialLikedIds={likedIds}
            currentUserId={currentUserId}
          />
        )}
      </main>
    </div>
  );
}
