import { getPopularList } from "@/services/main/main";
import { getLikeList } from "@/services/likes";
import PopularTabs from "./PopularTabs";

export default async function Popular() {
  const [{ usedGoods, rentals, jobs }, { likedIds, currentUserId }] = await Promise.all([
    getPopularList(),
    getLikeList(),
  ]);

  const usedGoodsItems = usedGoods
    .filter((p) => p.used_goods[0] != null)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      href: `/usedgoods/${p.id}`,
      title: p.title,
      price: p.used_goods[0].price,
      location: p.used_goods[0].location_type,
      likeCount: p.like_count,
      createdAt: p.created_at,
      popular: p.like_count >= 20,
      imageSrc: (p.used_goods[0].images as string[] | null)?.[0],
      initialIsLiked: likedIds.includes(p.id),
      currentUserId,
    }));

  const rentalItems = rentals
    .filter((p) => p.rentals[0] != null)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      href: `/rental/${p.id}`,
      title: p.title,
      price: p.rentals[0].price ?? 0,
      location: p.rentals[0].location ?? "",
      likeCount: p.like_count,
      createdAt: p.created_at,
      popular: p.like_count >= 20,
      imageSrc: (p.rentals[0].images as string[] | null)?.[0],
      initialIsLiked: likedIds.includes(p.id),
      currentUserId,
    }));

  const jobItems = jobs
    .filter((p) => p.jobs[0] != null)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      href: `/job/${p.id}`,
      title: p.title,
      price: p.jobs[0].salary,
      location: p.jobs[0].location_type,
      likeCount: p.like_count,
      createdAt: p.created_at,
      popular: p.like_count >= 20,
      imageSrc: (p.jobs[0].images as string[] | null)?.[0],
      initialIsLiked: likedIds.includes(p.id),
      currentUserId,
    }));

  return (
    <>
      <div className="mt-8">
        <h1 className="page-title-lg mb-6 md:mb-10">인기 목록</h1>
      </div>
      <PopularTabs
        usedGoodsItems={usedGoodsItems}
        jobItems={jobItems}
        rentalItems={rentalItems}
      />
    </>
  );
}
