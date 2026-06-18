import type { Tables } from "@/type/supabase";

export type Review = Tables<"reviews">;

// 프로필 후기 목록용 — 작성자(reviewer) 프로필 일부를 함께 조회
export interface ReviewWithReviewer extends Review {
  reviewer: Pick<Tables<"users">, "name" | "avatar_url"> | null;
}
