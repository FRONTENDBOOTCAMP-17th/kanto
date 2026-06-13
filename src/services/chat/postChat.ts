import { supabase } from "@/lib/supabase";

export default async function postChat(
  currentUserId: number,
  sellerId: number,
  postId: number,
): Promise<number> {
  const { data: existing } = await supabase
    .from("chats")
    .select("id")
    .or(
      `and(user_id_1.eq.${currentUserId},user_id_2.eq.${sellerId}),and(user_id_1.eq.${sellerId},user_id_2.eq.${currentUserId})`,
    )
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    return existing.id;
  } else {
    const { data, error } = await supabase
      .from("chats")
      .insert({
        user_id_1: currentUserId,
        user_id_2: sellerId,
        post_id: postId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return data.id;
  }
}
