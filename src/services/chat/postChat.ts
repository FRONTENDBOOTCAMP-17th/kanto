import { supabase } from "@/lib/supabase";

export default async function findChat(
  currentUserId: number,
  sellerId: number,
  postId: number,
): Promise<number | null> {
  const { data: existing } = await supabase
    .from("chats")
    .select("id")
    .or(
      `and(user_id_1.eq.${currentUserId},user_id_2.eq.${sellerId}),and(user_id_1.eq.${sellerId},user_id_2.eq.${currentUserId})`,
    )
    .eq("post_id", postId)
    .maybeSingle();

  return existing?.id ?? null;
}
