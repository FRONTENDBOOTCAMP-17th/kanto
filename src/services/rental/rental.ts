import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { RentalWithPost } from "@/type/rental/rentalList";
import type { RentalWithPost as RentalDetail } from "@/type/rental/rentalDetail";
import { supabase } from "@/lib/supabase";

const RENTAL_DETAIL_SELECT =
  `*, posts(*, users(id, name, email, avatar_url, provider, role, post_count, created_at, updated_at))` as const;
const RENTAL_LIST_SELECT = `
  *,
  rentals(*),
  users(id, name, avatar_url, created_at)
` as const;

export async function getRentalDetail(postId: number): Promise<RentalDetail> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("rentals")
    .select(RENTAL_DETAIL_SELECT)
    .eq("post_id", postId)
    .single();

  if (error) throw new Error(error.message);

  return data as unknown as RentalDetail;
}

interface RentalListFilter {
  search?: string;
  roomType?: string;
  location?: string;
}

export async function getRentalList(
  filter?: RentalListFilter,
): Promise<RentalWithPost[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("posts")
    .select(RENTAL_LIST_SELECT)
    .eq("post_type", "rental")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filter?.search) {
    query = query.ilike("title", `%${filter.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let result = data as unknown as RentalWithPost[];

  if (filter?.roomType) {
    result = result.filter(
      (p) => p.rentals?.[0]?.room_type === filter.roomType,
    );
  }
  if (filter?.location) {
    result = result.filter((p) => p.rentals?.[0]?.location === filter.location);
  }

  return result;
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
  const supabase = await createSupabaseServerClient();

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
