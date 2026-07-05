import { createClient } from "@/utils/supabase/server";
import type { UsedGoodsWithPost, ProductCondition } from "@/type/usedGoods";
import type { TradeLocation } from "@/type/location";

const USED_GOODS_SELECT = `
  *,
  used_goods(*),
  users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at)
` as const;

const USED_GOODS_LIST_SELECT = `
  *,
  used_goods!inner(*),
  users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at)
` as const;

interface UsedGoodsListFilter {
  search?: string;
  category?: string;
  condition?: string;
  location?: string;
  barangay?: string;
  targetIds?: number[];
  userId?: number;
  sort?: string;
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
  // price 는 used_goods 자식 테이블 컬럼이라 posts 기준 쿼리로는 정렬할 수 없어
  // used_goods 를 기준 테이블로 뒤집어 조회한다.
  if (filter?.sort === "price_asc" || filter?.sort === "price_desc") {
    return getUsedGoodsListByPrice(filter, pagination, filter.sort === "price_asc");
  }

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(USED_GOODS_LIST_SELECT, { count: "exact" })
    .eq("post_type", "used_goods")
    .eq("status", "active");

  if (filter?.sort === "latest") {
    query = query.order("created_at", { ascending: false });
  } else if (filter?.sort === "popular") {
    query = query
      .order("kpps_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else {
    query = query
      .order("is_popular", { ascending: false })
      .order("created_at", { ascending: false });
  }
  query = query.order("id", { ascending: false });

  if (filter?.targetIds !== undefined) {
    if (filter.targetIds.length === 0) return { posts: [], total: 0 };
    query = query.in("id", filter.targetIds);
  }
  if (filter?.userId) query = query.eq("user_id", filter.userId);
  if (filter?.search) query = query.ilike("title", `%${filter.search}%`);
  
  if (filter?.category) query = query.eq("used_goods.category", filter.category);
  if (filter?.condition) query = query.eq("used_goods.condition", filter.condition as ProductCondition);
  if (filter?.location) query = query.eq("used_goods.location_type", filter.location as TradeLocation);
  if (filter?.barangay) query = query.eq("used_goods.location_barangay", filter.barangay);

  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    query = query.range(from, from + pagination.pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { posts: (data as unknown as UsedGoodsWithPost[]) ?? [], total: count ?? 0 };
}

async function getUsedGoodsListByPrice(
  filter: UsedGoodsListFilter,
  pagination: Pagination | undefined,
  ascending: boolean,
): Promise<PagedResult<UsedGoodsWithPost>> {
  const supabase = await createClient();

  let query = supabase
    .from("used_goods")
    .select(
      `*, posts!inner(*, users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at))`,
      { count: "exact" },
    )
    .eq("posts.post_type", "used_goods")
    .eq("posts.status", "active");

  query = query
    .order("price", { ascending, nullsFirst: false })
    .order("post_id", { ascending: false });

  if (filter.targetIds !== undefined) {
    if (filter.targetIds.length === 0) return { posts: [], total: 0 };
    query = query.in("posts.id", filter.targetIds);
  }
  if (filter.userId) query = query.eq("posts.user_id", filter.userId);
  if (filter.search) query = query.ilike("posts.title", `%${filter.search}%`);

  if (filter.category) query = query.eq("category", filter.category);
  if (filter.condition) query = query.eq("condition", filter.condition as ProductCondition);
  if (filter.location) query = query.eq("location_type", filter.location as TradeLocation);
  if (filter.barangay) query = query.eq("location_barangay", filter.barangay);

  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    query = query.range(from, from + pagination.pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  type Row = Record<string, unknown> & { posts: Record<string, unknown> };
  const posts = ((data ?? []) as unknown as Row[]).map((row) => {
    const { posts: post, ...goods } = row;
    return { ...post, used_goods: [goods] };
  });

  return { posts: posts as unknown as UsedGoodsWithPost[], total: count ?? 0 };
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
    .neq("status", "deleted")
    .single();

  if (error) throw new Error(error.message);

  return data as unknown as UsedGoodsWithPost;
}

export async function getUsedGoodsItem(postId: number) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("used_goods")
    .select(`*, posts (*, users:public_profiles!posts_user_id_fkey (id, name, avatar_url, auth_id, created_at))`)
    .eq("post_id", postId)
    .neq("posts.status", "deleted")
    .maybeSingle();

  return data;
}

export async function getUsedGoodsBarangays(): Promise<Record<string, string[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("used_goods")
    .select("location_type, location_barangay, posts!inner(status)")
    .eq("posts.status", "active")
    .not("location_barangay", "is", null)
    .limit(2000);

  if (error) throw new Error(error.message);

  const grouped: Record<string, Set<string>> = {};
  for (const row of data ?? []) {
    const type = row.location_type as string;
    const barangay = row.location_barangay as string;
    (grouped[type] ??= new Set()).add(barangay);
  }
  return Object.fromEntries(
    Object.entries(grouped).map(([k, v]) => [k, [...v].sort()]),
  );
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

  return data as unknown as UsedGoodsWithPost[];
}
