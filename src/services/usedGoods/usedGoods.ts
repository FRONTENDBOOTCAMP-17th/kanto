import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UsedGoodsWithPost } from "@/type/usedGoods";

const USED_GOODS_SELECT = `
  *,
  used_goods(*),
  users(id, name, avatar_url, created_at)
` as const;

interface UsedGoodsListFilter {
  search?: string;
  category?: string;
  location?: string;
}

export async function getUsedGoodsList(filter?: UsedGoodsListFilter): Promise<UsedGoodsWithPost[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("posts")
    .select(USED_GOODS_SELECT)
    .eq("post_type", "used_goods")
    .eq("status", "active")
    .not("used_goods", "is", null)
    .order("created_at", { ascending: false });

  if (filter?.search) {
    query = query.ilike("title", `%${filter.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let result = data as UsedGoodsWithPost[];

  if (filter?.category) {
    result = result.filter((p) => p.used_goods?.[0]?.category === filter.category);
  }
  if (filter?.location) {
    result = result.filter((p) => p.used_goods?.[0]?.location_type === filter.location);
  }

  return result;
}

export async function getUsedGoodsDetail(
  postId: number,
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

export async function getUsedGoodsItem(postId: number) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("used_goods")
    .select(`*, posts (*, users (*))`)
    .eq("post_id", postId)
    .single();

  return data;
}

export async function getUsedGoodsByCategory(
  category: string,
): Promise<UsedGoodsWithPost[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select(USED_GOODS_SELECT)
    .eq("post_type", "used_goods")
    .eq("status", "active")
    .not("used_goods", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data as UsedGoodsWithPost[];
}
