import { createClient } from "@/utils/supabase/server";

interface LikeListResult {
  likedIds: number[];
  currentUserId: number | null;
}

export async function getLikeList(
  postType?: string,
): Promise<LikeListResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { likedIds: [], currentUserId: null };

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) return { likedIds: [], currentUserId: null };

  if (postType) {
    const { data, error } = await supabase
      .from("common_likes")
      .select("target_id, posts!inner(post_type)")
      .eq("user_id", userData.id)
      .eq("target_type", "post")
      .eq("posts.post_type", postType);

    if (error) throw new Error(error.message);
    return {
      likedIds: data.map((l) => l.target_id),
      currentUserId: userData.id,
    };
  }

  const { data, error } = await supabase
    .from("common_likes")
    .select("target_id")
    .eq("user_id", userData.id)
    .eq("target_type", "post");

  if (error) throw new Error(error.message);
  return {
    likedIds: data.map((l) => l.target_id),
    currentUserId: userData.id,
  };
}