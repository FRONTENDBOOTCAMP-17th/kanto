import { createClient } from "@/utils/supabase/server";
import type { JobDetail } from "@/type/job/jobsDetail";

const JOB_DETAIL_SELECT = `*, posts(*, public_profiles!posts_user_id_fkey(id, name, avatar_url, auth_id, created_at))` as const;

export async function getJobDetail(postId: number): Promise<JobDetail> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_DETAIL_SELECT)
    .eq("post_id", postId)
    .single();

  if (error) throw new Error(error.message);

  const post = (data as unknown as JobDetail).posts;
  if (post && (post as unknown as { status: string }).status === "deleted") {
    throw new Error("NOT_FOUND");
  }

  return data as unknown as JobDetail;
}
