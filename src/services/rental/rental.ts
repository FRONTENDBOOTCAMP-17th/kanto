import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { RentalWithPost } from "@/type/rental";
import type { RentalWithPost as RentalDetail } from "@/type/rental/rental";

const RENTAL_DETAIL_SELECT = `*, posts(*, users(*))` as const;
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

export async function getRentalList(): Promise<RentalWithPost[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select(RENTAL_LIST_SELECT)
    .eq("post_type", "rental")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data as unknown as RentalWithPost[];
}
