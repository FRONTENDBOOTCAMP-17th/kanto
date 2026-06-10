import { supabase } from "@/lib/supabase";

export async function toggleLike(
  postId: number,
  userId: number,
  isCurrentlyLiked: boolean,
) {
  if (isCurrentlyLiked) {
    return supabase
      .from("common_likes")
      .delete()
      .eq("user_id", userId)
      .eq("target_type", "post")
      .eq("target_id", postId);
  }
  return supabase
    .from("common_likes")
    .insert({ user_id: userId, target_type: "post", target_id: postId });
}
