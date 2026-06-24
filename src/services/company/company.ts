import { createClient } from "@/utils/supabase/server";
import type { Company } from "@/type/company";
import type { JobWithPost } from "@/type/job/jobList";

export async function getCompanyByUserId(userId: number): Promise<Company | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data ?? null;
}

export async function getUserJobPostings(userId: number): Promise<JobWithPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, jobs!inner(*), users!posts_user_id_fkey(id, name, avatar_url, created_at)")
    .eq("post_type", "jobs")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as JobWithPost[]) ?? [];
}
