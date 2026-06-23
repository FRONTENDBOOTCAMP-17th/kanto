import { createClient } from "@/utils/supabase/server";
import { getCurrentUserId } from "@/services/user/user";

interface LikeListResult {
  likedIds: number[];
  currentUserId: number | null;
}

export async function getLikeList(
  postType?: string,
): Promise<LikeListResult> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { likedIds: [], currentUserId: null };

  const supabase = await createClient();

  if (postType) {
    const { data, error } = await supabase
      .from("common_likes")
      .select("target_id, posts!inner(post_type)")
      .eq("user_id", currentUserId)
      .eq("target_type", "post")
      .eq("posts.post_type", postType);

    if (error) throw new Error(error.message);
    return {
      likedIds: data.map((l) => l.target_id),
      currentUserId,
    };
  }

  const { data, error } = await supabase
    .from("common_likes")
    .select("target_id")
    .eq("user_id", currentUserId)
    .eq("target_type", "post");

  if (error) throw new Error(error.message);
  return {
    likedIds: data.map((l) => l.target_id),
    currentUserId,
  };
}