import { createClient } from "@/utils/supabase/server";
import type { RentalWithPost } from "@/type/rental/rentalList";
import type { RentalWithPost as RentalDetail } from "@/type/rental/rentalDetail";
import type { Pagination, PagedResult } from "@/services/usedGoods/usedGoods";
import type { TradeLocation } from "@/type/location";
import { encryptPostId } from "@/utils/postIdCipher";

const RENTAL_DETAIL_SELECT =
  `*, posts(*, users:public_profiles!posts_user_id_fkey(id, name, avatar_url, auth_id, created_at))` as const;

const RENTAL_LIST_SELECT = `
  *,
  rentals!inner(*),
  users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at)
` as const;

export async function getRentalDetail(postId: number): Promise<RentalDetail> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rentals")
    .select(RENTAL_DETAIL_SELECT)
    .eq("post_id", postId)
    .single();

  if (error) throw new Error(error.message);

  const post = (data as unknown as RentalDetail).posts;
  if (post && (post as unknown as { status: string }).status === "deleted") {
    throw new Error("NOT_FOUND");
  }

  return data as unknown as RentalDetail;
}

interface RentalListFilter {
  search?: string;
  roomType?: string;
  rentType?: string;
  location?: string;
  barangay?: string;
  targetIds?: number[];
  userId?: number;
  sort?: string;
}

export async function getRentalList(
  filter?: RentalListFilter,
  pagination?: Pagination,
): Promise<PagedResult<RentalWithPost>> {
  if (filter?.sort === "price_asc" || filter?.sort === "price_desc") {
    return getRentalListByPrice(filter, pagination, filter.sort === "price_asc");
  }

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(RENTAL_LIST_SELECT, { count: "exact" })
    .eq("post_type", "rental")
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
  
  if (filter?.roomType) query = query.eq("rentals.room_type", filter.roomType);
  if (filter?.rentType) query = query.eq("rentals.rent_type", filter.rentType);
  if (filter?.location) query = query.eq("rentals.location", filter.location as TradeLocation);
  if (filter?.barangay) query = query.eq("rentals.location_barangay", filter.barangay);

  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    query = query.range(from, from + pagination.pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const posts = ((data as unknown as RentalWithPost[]) ?? []).map((p) => ({
    ...p,
    id_token: encryptPostId(p.id),
  }));

  return { posts, total: count ?? 0 };
}

async function getRentalListByPrice(
  filter: RentalListFilter,
  pagination: Pagination | undefined,
  ascending: boolean,
): Promise<PagedResult<RentalWithPost>> {
  const supabase = await createClient();

  let query = supabase
    .from("rentals")
    .select(
      `*, posts!inner(*, users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at))`,
      { count: "exact" },
    )
    .eq("posts.post_type", "rental")
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

  if (filter.roomType) query = query.eq("room_type", filter.roomType);
  if (filter.rentType) query = query.eq("rent_type", filter.rentType);
  if (filter.location) query = query.eq("location", filter.location as TradeLocation);
  if (filter.barangay) query = query.eq("location_barangay", filter.barangay);

  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    query = query.range(from, from + pagination.pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  type Row = Record<string, unknown> & { posts: Record<string, unknown> };
  const posts = ((data ?? []) as unknown as Row[]).map((row) => {
    const { posts: post, ...rental } = row;
    return { ...post, rentals: [rental] };
  });

  return { posts: posts as unknown as RentalWithPost[], total: count ?? 0 };
}

export async function getRentalBarangays(): Promise<Record<string, string[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rentals")
    .select("location, location_barangay, posts!inner(status)")
    .eq("posts.status", "active")
    .not("location_barangay", "is", null)
    .limit(2000);

  if (error) throw new Error(error.message);

  const grouped: Record<string, Set<string>> = {};
  for (const row of data ?? []) {
    const type = row.location as string | null;
    const barangay = row.location_barangay as string;
    if (!type) continue;
    (grouped[type] ??= new Set()).add(barangay);
  }
  return Object.fromEntries(
    Object.entries(grouped).map(([k, v]) => [k, [...v].sort()]),
  );
}

interface RentalCreate {
  title: string;
  price: number;
  deposit: number;
  rent_type: "월세" | "매매";
  room_type: "스튜디오" | "투룸" | "아파트";
  max_occupants: number;
  description: string;
  amenities: ("와이파이" | "에어컨" | "주차" | "주방")[];
  images: string[];
  location:
    | "BGC / Taguig"
    | "Makati"
    | "Pasay / Paranaque"
    | "Quezon City"
    | "Mandaluyong / Pasig"
    | "Pampanga"
    | "그 외 지역";
  location_detail: string;
}

export async function getRentalCreate(input: RentalCreate) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: publicUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (userError) throw new Error(userError.message);

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      post_type: "rental",
      status: "active",
      title: input.title,
      user_id: publicUser.id,
    })
    .select()
    .single();

  if (postError) throw new Error(postError.message);

  const { error: rentalError } = await supabase.from("rentals").insert({
    post_id: post.id,
    price: input.price,
    deposit: input.deposit,
    rent_type: input.rent_type,
    room_type: input.room_type,
    max_occupants: input.max_occupants,
    description: input.description,
    amenities: input.amenities,
    images: input.images,
    location: input.location,
    location_detail: input.location_detail,
  });

  if (rentalError) throw new Error(rentalError.message);
}
