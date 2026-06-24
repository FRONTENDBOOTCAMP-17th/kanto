import type { Tables } from "@/type/supabase";

export type Review = Tables<"reviews">;

export interface ReviewWithReviewer extends Review {
  reviewer: Pick<Tables<"users">, "name" | "avatar_url"> | null;
}
