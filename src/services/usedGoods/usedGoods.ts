import { createClient } from "@/utils/supabase/server";
import type { UsedGoodsWithPost } from "@/type/usedGoods";
import type { TradeLocation } from "@/type/location";

const USED_GOODS_SELECT = `
  *,
  used_goods(*),
  users!posts_user_id_fkey(id, name, avatar_url, created_at)
` as const;

// 목록용: used_goods 를 inner join 해 자식 컬럼(category/location_type)으로 DB 필터링 가능.
const USED_GOODS_LIST_SELECT = `
  *,
  used_goods!inner(*),
  users!posts_user_id_fkey(id, name, avatar_url, created_at)
` as const;

interface UsedGoodsListFilter {
  search?: string;
  category?: string;
  location?: string;
  targetIds?: number[];
  userId?: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  posts: T[];
  total: number;
}

export async function getUsedGoodsList(
  filter?: UsedGoodsListFilter,
  pagination?: Pagination,
): Promise<PagedResult<UsedGoodsWithPost>> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(USED_GOODS_LIST_SELECT, { count: "exact" })
    .eq("post_type", "used_goods")
    .eq("status", "active")
    .order("is_popular", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (filter?.targetIds !== undefined) {
    if (filter.targetIds.length === 0) return { posts: [], total: 0 };
    query = query.in("id", filter.targetIds);
  }
  if (filter?.userId) query = query.eq("user_id", filter.userId);
  if (filter?.search) query = query.ilike("title", `%${filter.search}%`);
  // 카테고리/지역 필터를 DB(inner join 자식 컬럼)로 push.
  if (filter?.category) query = query.eq("used_goods.category", filter.category);
  if (filter?.location) query = query.eq("used_goods.location_type", filter.location as TradeLocation);

  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    query = query.range(from, from + pagination.pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { posts: (data as UsedGoodsWithPost[]) ?? [], total: count ?? 0 };
}

export async function getUsedGoodsDetail(
  postId: number,
): Promise<UsedGoodsWithPost> {
  const supabase = await createClient();

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
  const supabase = await createClient();

  const { data } = await supabase
    .from("used_goods")
    .select(`*, posts (*, users!posts_user_id_fkey (id, name, avatar_url, auth_id, created_at))`)
    .eq("post_id", postId)
    .single();

  return data;
}

export async function getUsedGoodsByCategory() {
  const supabase = await createClient();

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
