import { createClient } from "@/utils/supabase/server";

export async function viewCountUp(postId: number) {
  const supabase = await createClient();

  return await supabase.rpc("increment_view_count", { p_post_id: postId });
}
