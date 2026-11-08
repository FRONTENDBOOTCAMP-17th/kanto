import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { createPublicClient, type PublicSupabaseClient } from "@/utils/supabase/public";
import type { JobDetail } from "@/type/job/jobsDetail";

const JOB_DETAIL_SELECT = `*, posts(*, users:public_profiles!posts_user_id_fkey(id, name, avatar_url, auth_id, created_at))` as const;

export async function getJobDetail(
  postId: number,
  client?: PublicSupabaseClient,
): Promise<JobDetail> {
  const supabase = client ?? (await createClient());

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

// 상세 페이지(ISR)·generateMetadata 공용: 쿠키 없이 조회하고 같은 렌더 안에서는 한 번만 조회한다.
export const getPublicJobDetail = cache((postId: number) =>
  getJobDetail(postId, createPublicClient()),
);
