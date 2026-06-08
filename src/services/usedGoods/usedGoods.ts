import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UsedGoodsWithPost } from "@/type/usedGoods";

const USED_GOODS_SELECT = `
  *,
  used_goods(*),
  users(id, name, avatar_url, created_at)
` as const;

export async function getUsedGoodsList(): Promise<UsedGoodsWithPost[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select(USED_GOODS_SELECT)
    .eq("post_type", "used_goods")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data as UsedGoodsWithPost[];
}

export async function getUsedGoodsDetail(
  postId: number
): Promise<UsedGoodsWithPost> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select(USED_GOODS_SELECT)
    .eq("id", postId)
    .eq("post_type", "used_goods")
    .single();

  if (error) throw new Error(error.message);

  return data as UsedGoodsWithPost;
}

export async function getUsedGoodsByCategory(
  category: string
): Promise<UsedGoodsWithPost[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select(USED_GOODS_SELECT)
    .eq("post_type", "used_goods")
    .eq("used_goods.category", category)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data as UsedGoodsWithPost[];
}
