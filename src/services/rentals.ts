import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { RentalWithPost } from "@/type/rental";

const RENTAL_SELECT = `
  *,
  rentals(*),
  users(id, name, avatar_url, created_at)
` as const;

export async function getRentalList(): Promise<RentalWithPost[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select(RENTAL_SELECT)
    .eq("post_type", "rental")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data as RentalWithPost[];
}
