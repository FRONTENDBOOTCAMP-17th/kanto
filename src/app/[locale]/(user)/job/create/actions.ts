"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSpamConfig, containsProfanity } from "@/services/admin/adminContent";

// profanityText: 제목 외에 본문(주요업무·회사소개 등)까지 합친 검사용 텍스트.
// 클라이언트 검사는 우회 가능하므로 서버에서 한 번 더 강제한다.
export async function createJobPostRecord(title: string, profanityText: string): Promise<{ postId: number }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("UNAUTHORIZED");

  const { data: publicUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!publicUser) throw new Error("UNAUTHORIZED");

  if (await containsProfanity(profanityText)) throw new Error("PROFANITY");

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
