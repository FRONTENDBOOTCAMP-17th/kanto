import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Review, ReviewWithReviewer } from "@/type/review";

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

  await recalcAvgRating(input.revieweeId);

  return data as Review;
}

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
