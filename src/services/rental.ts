import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { RentalWithPost } from "@/type/rental/rental";

const RENTAL_SELECT = `*, posts(*, users(*))` as const;

export async function getRentalDetail(postId: number): Promise<RentalWithPost> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("rentals")
    .select(RENTAL_SELECT)
    .eq("post_id", postId)
    .single();

  if (error) throw new Error(error.message);

  return data as RentalWithPost;
}
