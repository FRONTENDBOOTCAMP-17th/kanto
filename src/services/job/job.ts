import { createClient } from "@/utils/supabase/server";
import type { JobWithPost } from "@/type/job/jobList";

interface JobListFilter {
  search?: string;
  employeeType?: string;
  location?: string;
}

export async function getJobList(filter?: JobListFilter): Promise<JobWithPost[]> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, jobs(*), users(id, name, avatar_url, created_at)")
    .eq("post_type", "jobs")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filter?.search) {
    query = query.ilike("title", `%${filter.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let result = data as unknown as JobWithPost[];

  if (filter?.employeeType) {
    result = result.filter(
      (p) => p.jobs?.[0]?.employee_type === filter.employeeType,
    );
  }
  if (filter?.location) {
    result = result.filter(
      (p) => p.jobs?.[0]?.location_type === filter.location,
    );
  }

  return result;
}

export async function getPopularJobs(): Promise<JobWithPost[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, jobs!inner(*), users(id, name, avatar_url, created_at)")
    .eq("post_type", "jobs");

  if (error) throw new Error(error.message);

  type JobWithPopular = JobWithPost & {
    jobs: (JobWithPost["jobs"][number] & { popular_count: number | null })[];
  };

  return (data as unknown as JobWithPopular[])
    .filter((p) => p.jobs?.[0]?.popular_count != null)
    .sort(
      (a, b) =>
        (a.jobs[0].popular_count ?? 99) - (b.jobs[0].popular_count ?? 99),
    )
    .slice(0, 5) as unknown as JobWithPost[];
}
