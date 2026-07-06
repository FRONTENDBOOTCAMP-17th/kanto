"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSpamConfig } from "@/services/admin/adminContent";

export async function createJobPostRecord(title: string): Promise<{ postId: number }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("UNAUTHORIZED");

  const { data: publicUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!publicUser) throw new Error("UNAUTHORIZED");

  const config = await getSpamConfig().catch(() => null);
  const windowSec = config?.post_window_sec ?? 60;
  const maxCount = config?.post_max_count ?? 3;

  const since = new Date(Date.now() - windowSec * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", publicUser.id)
    .gte("created_at", since);

  if ((count ?? 0) >= maxCount) throw new Error("RATE_LIMIT");

  const { data: post, error: postError } = await supabaseAdmin
    .from("posts")
    .insert({ user_id: publicUser.id, post_type: "jobs", title, status: "active", view_count: 0, like_count: 0 })
    .select("id")
    .single();

  if (postError || !post) throw new Error("POST_INSERT_FAILED");

  return { postId: post.id };
}
