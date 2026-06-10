import { createSupabaseServerClient } from "@/lib/supabaseServer";

// 찜목록 조회

export async function getLikeList(
  postType?: string,
): Promise<number[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) return [];

  if (postType) {
    const { data, error } = await supabase
      .from("common_likes")
      .select("target_id, posts!inner(post_type)")
      .eq("user_id", userData.id)
      .eq("target_type", "post")
      .eq("posts.post_type", postType);

    if (error) throw new Error(error.message);
    return data.map((l) => l.target_id);
  }

  const { data, error } = await supabase
    .from("common_likes")
    .select("target_id")
    .eq("user_id", userData.id)
    .eq("target_type", "post");

  if (error) throw new Error(error.message);
  return data.map((l) => l.target_id);
}