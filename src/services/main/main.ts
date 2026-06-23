import { getJobList } from "@/services/job/job";
import { getRentalList } from "@/services/rental/rental";
import { getUsedGoodsList } from "@/services/usedGoods/usedGoods";

export async function getPopularList() {
  // 메인 인기 섹션은 종류별 최신 4건만 노출 → 전체 테이블 대신 4건씩만 페치.
  const paging = { page: 1, pageSize: 4 };
  const [usedGoods, rentals, jobs] = await Promise.all([
    getUsedGoodsList(undefined, paging),
    getRentalList(undefined, paging),
    getJobList(undefined, paging),
  ]);
  return { usedGoods: usedGoods.posts, rentals: rentals.posts, jobs: jobs.posts };
}
