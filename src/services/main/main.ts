import { getJobList } from "@/services/job/job";
import { getRentalList } from "@/services/rental/rental";
import { getUsedGoodsList } from "@/services/usedGoods/usedGoods";

export async function getPopularList() {
  const [usedGoods, rentals, jobs] = await Promise.all([
    getUsedGoodsList(),
    getRentalList(),
    getJobList(),
  ]);
  return { usedGoods, rentals, jobs };
}
