import { createClient } from "@/utils/supabase/server";
import type { JobDetail } from "@/type/job/jobsDetail";

const JOB_DETAIL_SELECT = `*, posts(*, users!posts_user_id_fkey(id, name, avatar_url, auth_id, role, post_count, created_at))` as const;

export async function getJobDetail(postId: number): Promise<JobDetail> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_DETAIL_SELECT)
    .eq("post_id", postId)
    .single();

  if (error) throw new Error(error.message);

  return data as unknown as JobDetail;
}
