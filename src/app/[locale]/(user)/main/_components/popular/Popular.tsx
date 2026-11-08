import { getTranslations } from "next-intl/server";
import { getPopularList } from "@/services/main/main";
import PopularTabs from "./PopularTabs";
import PopularRefreshButton from "./PopularRefreshButton";
import { encryptPostId } from "@/utils/postIdCipher";

export default async function Popular() {
  const t = await getTranslations("Main");
  // 정적(ISR) 페이지라 서버에서 로그인 사용자를 알 수 없다: 좋아요 여부는 LikeButton이 클라이언트에서 조회한다.
  // 조회 실패 시 빈 목록으로 렌더링한다 (ISR: 다음 재생성 때 다시 채워짐, 빌드 환경에서 DB 미접속 대비)
  const { usedGoods, rentals, jobs } = await getPopularList().catch(() => ({
    usedGoods: [],
    rentals: [],
    jobs: [],
  }));

  const usedGoodsItems = usedGoods
    .filter((p) => p.used_goods[0] != null)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      href: `/usedgoods/${encryptPostId(p.id)}`,
      title: p.title,
      price: p.used_goods[0].price,
      location: p.used_goods[0].location_type,
      likeCount: p.like_count,
      createdAt: p.created_at,
      popular: p.is_popular ?? false,
      images: (p.used_goods[0].images as string[] | null) ?? [],
      initialIsLiked: false,
      currentUserId: undefined,
    }));

  const rentalItems = rentals
    .filter((p) => p.rentals[0] != null)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      href: `/rental/${encryptPostId(p.id)}`,
      title: p.title,
      price: p.rentals[0].price ?? 0,
      location: p.rentals[0].location ?? "",
      likeCount: p.like_count,
      createdAt: p.created_at,
      popular: p.is_popular ?? false,
      images: (p.rentals[0].images as string[] | null) ?? [],
      initialIsLiked: false,
      currentUserId: undefined,
    }));

  const jobItems = jobs
    .filter((p) => p.jobs[0] != null)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      href: `/job/${encryptPostId(p.id)}`,
      title: p.title,
      price: p.jobs[0].salary,
      location: p.jobs[0].location_custom ?? p.jobs[0].location_type,
      likeCount: p.like_count,
      createdAt: p.created_at,
      popular: p.like_count >= 20,
      images: (p.jobs[0].images as string[] | null) ?? [],
      initialIsLiked: false,
      currentUserId: undefined,
    }));

  return (
    <>
      <div className="mt-8 mb-6 md:mb-10 flex items-center justify-between">
        <h1 className="page-title-lg">{t("popularTitle")}</h1>
        {process.env.NODE_ENV === "development" && <PopularRefreshButton />}
      </div>
      <PopularTabs
        usedGoodsItems={usedGoodsItems}
        jobItems={jobItems}
        rentalItems={rentalItems}
      />
    </>
  );
}
