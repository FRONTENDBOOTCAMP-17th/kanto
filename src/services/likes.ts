import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * 특정 유저가 찜한 게시글의 ID 목록을 반환한다.
 * postType을 전달하면 해당 타입('usedgoods', 'parttime' 등)의 게시글만 필터링한다.
 * postType을 생략하면 모든 타입의 찜 목록을 반환한다.
 */
export async function getUserLikes(
  userId: number,
  postType?: string,
): Promise<number[]> {
  const supabase = await createSupabaseServerClient();

  if (postType) {
    // posts 테이블과 inner join하여 특정 post_type의 찜만 조회
    const { data, error } = await supabase
      .from("common_likes")
      .select("target_id, posts!inner(post_type)")
      .eq("user_id", userId)
      .eq("target_type", "post")
      .eq("posts.post_type", postType);

    if (error) throw new Error(error.message);
    return data.map((l) => l.target_id);
  }

  const { data, error } = await supabase
    .from("common_likes")
    .select("target_id")
    .eq("user_id", userId)
    .eq("target_type", "post");

  if (error) throw new Error(error.message);
  return data.map((l) => l.target_id);
}

/**
 * 유저가 게시글을 찜한다.
 * common_likes 테이블에 (userId, "post", postId) 레코드를 삽입한다.
 */
export async function addLike(postId: number, userId: number): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("common_likes")
    .insert({ user_id: userId, target_type: "post", target_id: postId });

  if (error) throw new Error(error.message);
}

/**
 * 유저가 게시글 찜을 취소한다.
 * common_likes 테이블에서 (userId, "post", postId)에 해당하는 레코드를 삭제한다.
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
