import { getJobList } from "@/services/job/job";
import { createPublicClient } from "@/utils/supabase/public";
import type { RentalWithPost } from "@/type/rental/rentalList";
import type { UsedGoodsWithPost } from "@/type/usedGoods";

const POPULAR_RENTAL_SELECT = `
  *,
  rentals!inner(*),
  users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at)
` as const;

const POPULAR_USED_GOODS_SELECT = `
  *,
  used_goods!inner(*),
  users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at)
` as const;

// 메인 페이지(ISR)용: 쿠키를 읽지 않는 공개 클라이언트로 조회한다.
export async function getPopularList() {
  const supabase = createPublicClient();

  const [{ data: rentalData }, { data: usedGoodsData }, jobs] = await Promise.all([
    supabase
      .from("posts")
      .select(POPULAR_RENTAL_SELECT)
      .eq("post_type", "rental")
      .eq("status", "active")
      .eq("is_popular", true)
      .order("kpps_score", { ascending: false })
      .limit(4),
    supabase
      .from("posts")
      .select(POPULAR_USED_GOODS_SELECT)
      .eq("post_type", "used_goods")
      .eq("status", "active")
      .eq("is_popular", true)
      .eq("is_sold", false)
      .order("kpps_score", { ascending: false })
      .limit(4),
    getJobList(undefined, { page: 1, pageSize: 4 }, supabase),
  ]);

  return {
    rentals: (rentalData as unknown as RentalWithPost[]) ?? [],
    usedGoods: (usedGoodsData as unknown as UsedGoodsWithPost[]) ?? [],
    jobs: jobs.posts,
  };
}
