import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { JobWithPost } from "@/type/job";

interface JobListFilter {
  search?: string;
  employeeType?: string;
  location?: string;
}

export async function getJobList(filter?: JobListFilter): Promise<JobWithPost[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("posts")
    .select("*, jobs(*), users(id, name, avatar_url, created_at)")
    .eq("post_type", "jobs")
    .order("created_at", { ascending: false });

  if (filter?.search) {
    query = query.ilike("title", `%${filter.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let result = data as unknown as JobWithPost[];

  if (filter?.employeeType) {
    result = result.filter((p) => p.jobs?.[0]?.employee_type === filter.employeeType);
  }
  if (filter?.location) {
    result = result.filter((p) => p.jobs?.[0]?.location_type === filter.location);
  }

  return result;
}
