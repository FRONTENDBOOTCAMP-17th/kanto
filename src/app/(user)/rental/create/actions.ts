"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSpamConfig, containsProfanity } from "@/services/admin/adminContent";

// 렌탈 글의 posts 레코드를 서버에서 생성한다.
// 클라이언트 검사(도배/금칙어)는 빠른 안내용일 뿐이라 개발자 도구로 우회 가능하므로,
// 실제 차단(rate limit + 금칙어)은 이 서버 액션이 쥔다. 구인(createJobPostRecord)과 동일한 결.
export async function createRentalPostRecord(input: {
  title: string;
  description: string;
}): Promise<{ postId: number }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("UNAUTHORIZED");

  const { data: publicUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!publicUser) throw new Error("UNAUTHORIZED");

  if (await containsProfanity([input.title, input.description].join(" "))) {
    throw new Error("PROFANITY");
  }

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
    .insert({ user_id: publicUser.id, post_type: "rental", title: input.title, status: "active", view_count: 0, like_count: 0 })
    .select("id")
    .single();

  if (postError || !post) throw new Error("POST_INSERT_FAILED");

  return { postId: post.id };
}
