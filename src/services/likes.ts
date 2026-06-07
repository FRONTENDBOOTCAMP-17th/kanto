import { createSupabaseServerClient } from "@/lib/supabaseServer";
// 찜목록에서 카테고리별로 나누기로해서 선택적으로 받는걸로함
export async function getUserLikedPostIds(
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

/*

 common_likes 테이블에 (userId, post, postId) 레코드를 삽입한다.
 */
export async function addLike(postId: number, userId: number): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("common_likes")
    .insert({ user_id: userId, target_type: "post", target_id: postId });

  if (error) throw new Error(error.message);
}

/* 
 common_likes 테이블에서 (userId, "post", postId)에 해당하는 레코드를 삭제한다.
 */
export async function removeLike(
  postId: number,
  userId: number,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("common_likes")
    .delete()
    .eq("user_id", userId)
    .eq("target_type", "post")
    .eq("target_id", postId);

  if (error) throw new Error(error.message);
}
