import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Review, ReviewWithReviewer } from "@/type/review";

// 후기 쓰기/조회는 모두 service-role(supabaseAdmin)로 수행 — RLS 우회.
// (거래 서비스 transaction.ts 와 동일한 패턴)

export async function createReview(input: {
  reviewerId: number;
  revieweeId: number;
  role: "buyer" | "seller";
  rating: number;
  content: string;
  transactionId: number;
  postId: number;
  postTitle: string | null;
  postPrice: number | null;
}): Promise<Review> {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      reviewer_id: input.reviewerId,
      reviewee_id: input.revieweeId,
      role: input.role,
      rating: input.rating,
      content: input.content,
      transaction_id: input.transactionId,
      post_id: input.postId,
      post_title: input.postTitle,
      post_price: input.postPrice,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // 후기 대상자의 평균 평점 재계산
  await recalcAvgRating(input.revieweeId);

  return data as Review;
}

/**
 * 후기 대상자(reviewee)의 평균 평점을 reviews 테이블 기준으로 재계산해
 * users.avg_rating 에 반영한다. 삭제된 후기는 제외한다.
 */
export async function recalcAvgRating(revieweeId: number): Promise<void> {
  const { data } = await supabaseAdmin
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", revieweeId)
    .is("deleted_at", null);

  const ratings = (data ?? []).map((r) => r.rating);
  const avg =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : null;

  await supabaseAdmin
    .from("users")
    .update({ avg_rating: avg })
    .eq("id", revieweeId);
}

/**
 * 특정 거래(transaction)에 대해 해당 작성자가 이미 남긴 후기를 조회한다.
 * 거래당 1후기(중복 작성 방지) 판정에 사용한다.
 */
export async function getReviewByTransactionAndReviewer(
  transactionId: number,
  reviewerId: number,
): Promise<Review | null> {
  const { data } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("transaction_id", transactionId)
    .eq("reviewer_id", reviewerId)
    .is("deleted_at", null)
    .maybeSingle();

  return (data as Review) ?? null;
}

/**
 * 후기 대상자(reviewee)가 받은 후기 목록을 작성자 정보와 함께 조회한다.
 * 프로필 "거래 후기" 탭에서 사용.
 */
export async function getReviewsForUser(
  revieweeId: number,
): Promise<ReviewWithReviewer[]> {
  const { data } = await supabaseAdmin
    .from("reviews")
    .select("*, reviewer:users!reviews_reviewer_id_fkey(name, avatar_url)")
    .eq("reviewee_id", revieweeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (data ?? []) as ReviewWithReviewer[];
}
