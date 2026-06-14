import { createClient } from "@/utils/supabase/server";
import type { RentalWithPost } from "@/type/rental/rentalList";
import type { RentalWithPost as RentalDetail } from "@/type/rental/rentalDetail";

const RENTAL_DETAIL_SELECT =
  `*, posts(*, users(id, name, email, avatar_url, auth_id, provider, role, post_count, created_at, updated_at))` as const;
const RENTAL_LIST_SELECT = `
  *,
  rentals(*),
  users(id, name, avatar_url, created_at)
` as const;

export async function getRentalDetail(postId: number): Promise<RentalDetail> {
  const supabase = await createClient();

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

export async function getRentalList(filter?: RentalListFilter): Promise<RentalWithPost[]> {
  const supabase = await createClient();

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
