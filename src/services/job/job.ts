import { createClient } from "@/utils/supabase/server";
import type { JobWithPost } from "@/type/job/jobList";
import type { Pagination, PagedResult } from "@/services/usedGoods/usedGoods";
import type { TradeLocation } from "@/type/location";

interface JobListFilter {
  search?: string;
  employeeType?: string;
  location?: string;
  targetIds?: number[];
  userId?: number;
}

export async function getJobList(
  filter?: JobListFilter,
  pagination?: Pagination,
): Promise<PagedResult<JobWithPost>> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, jobs!inner(*), users!posts_user_id_fkey(id, name, avatar_url, created_at)", {
      count: "exact",
    })
    .eq("post_type", "jobs")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (filter?.targetIds !== undefined) {
    if (filter.targetIds.length === 0) return { posts: [], total: 0 };
    query = query.in("id", filter.targetIds);
  }
  if (filter?.userId) query = query.eq("user_id", filter.userId);
  if (filter?.search) query = query.ilike("title", `%${filter.search}%`);
  // 고용형태/지역 필터를 DB(inner join 자식 컬럼)로 push.
  if (filter?.employeeType) query = query.eq("jobs.employee_type", filter.employeeType);
  if (filter?.location) query = query.eq("jobs.location_type", filter.location as TradeLocation);

  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    query = query.range(from, from + pagination.pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { posts: (data as unknown as JobWithPost[]) ?? [], total: count ?? 0 };
}

export async function getPopularJobs(): Promise<JobWithPost[]> {
  const supabase = await createClient();

  // popular_count 가 설정된(큐레이션된) 글만 DB에서 추려온다. 전체 스캔 제거.
  const { data, error } = await supabase
    .from("posts")
    .select("*, jobs!inner(*), users!posts_user_id_fkey(id, name, avatar_url, created_at)")
    .eq("post_type", "jobs")
    .eq("status", "active")
    .not("jobs.popular_count", "is", null);

  if (error) throw new Error(error.message);

  type JobWithPopular = JobWithPost & {
    jobs: (JobWithPost["jobs"][number] & { popular_count: number | null })[];
  };

  // 부모를 자식 컬럼으로 정렬하는 건 PostgREST에서 불가 → 추려온 소량만 JS 정렬.
  return (data as unknown as JobWithPopular[])
    .sort(
      (a, b) =>
        (a.jobs[0].popular_count ?? 99) - (b.jobs[0].popular_count ?? 99),
    )
    .slice(0, 5) as unknown as JobWithPost[];
}
