import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { JobDetail } from "@/type/job/jobsDetail";

const JOB_DETAIL_SELECT = `*, posts(*, users(*))` as const;

export async function getJobDetail(postId: number): Promise<JobDetail> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_DETAIL_SELECT)
    .eq("post_id", postId)
    .single();

  if (error) throw new Error(error.message);

  return data as unknown as JobDetail;
}
