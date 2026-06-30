import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/type/supabase";

export async function viewCountUp(postId: number) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  await supabase.rpc("increment_view_count", { p_post_id: postId });
}
