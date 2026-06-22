import { supabase } from "@/lib/supabase";

export async function toggleLike(
  postId: number,
  userId: number,
  isCurrentlyLiked: boolean,
) {
  if (isCurrentlyLiked) {
    return deleteLike(userId, postId);
  }
  return postLike(userId, postId);
}

async function deleteLike(userId: number, postId: number) {
  return supabase
    .from("common_likes")
    .delete()
    .eq("user_id", userId)
    .eq("target_type", "post")
    .eq("target_id", postId);
}

async function postLike(userId: number, postId: number) {
  return supabase
    .from("common_likes")
    .insert({ user_id: userId, target_type: "post", target_id: postId });
}
