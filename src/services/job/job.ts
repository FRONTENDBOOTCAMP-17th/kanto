import { createClient } from "@/utils/supabase/server";
import type { JobWithPost } from "@/type/job/jobList";
import type { Pagination, PagedResult } from "@/services/usedGoods/usedGoods";
import type { TradeLocation } from "@/type/location";

interface JobListFilter {
  search?: string;
  employeeType?: string;
  salaryType?: string;
  location?: string;
  targetIds?: number[];
  userId?: number;
  sort?: string;
}

export async function getJobList(
  filter?: JobListFilter,
  pagination?: Pagination,
): Promise<PagedResult<JobWithPost>> {
  // 인기순: jobs 는 kpps 스코어링 대상이 아니고 관리자가 지정한 popular_count(자식 테이블)만
  // 인기 신호로 존재한다. 부모(posts)를 자식 컬럼으로 정렬할 수 없어 jobs 기준으로 뒤집어 조회한다.
  // sort 미지정(찜/내 글/홈 등 다른 호출자)은 기존 최신순을 유지한다.
  if (filter?.sort === "popular") {
    return getJobListByPopular(filter, pagination);
  }
  // 마감일순: deadline 은 자식(jobs) 컬럼이라 부모(posts) 기준 정렬이 불가능해
  // jobs 기준으로 뒤집어 조회한다. 마감이 지난 공고는 목록에서 제외한다.
  if (filter?.sort === "deadline") {
    return getJobListByDeadline(filter, pagination);
  }

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, jobs!inner(*), users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at)", {
      count: "exact",
    })
    .eq("post_type", "jobs")
    .eq("status", "active");

  query = query.order("created_at", { ascending: false });
  query = query.order("id", { ascending: false });

  if (filter?.targetIds !== undefined) {
    if (filter.targetIds.length === 0) return { posts: [], total: 0 };
    query = query.in("id", filter.targetIds);
  }
  if (filter?.userId) query = query.eq("user_id", filter.userId);
  if (filter?.search) query = query.ilike("title", `%${filter.search}%`);
  
  if (filter?.employeeType) query = query.eq("jobs.employee_type", filter.employeeType);
  if (filter?.salaryType) query = query.eq("jobs.salary_type", filter.salaryType);
  if (filter?.location) query = query.eq("jobs.location_type", filter.location as TradeLocation);

  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    query = query.range(from, from + pagination.pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { posts: (data as unknown as JobWithPost[]) ?? [], total: count ?? 0 };
}

async function getJobListByPopular(
  filter: JobListFilter,
  pagination: Pagination | undefined,
): Promise<PagedResult<JobWithPost>> {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select(
      "*, posts!inner(*, users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at))",
      { count: "exact" },
    )
    .eq("posts.post_type", "jobs")
    .eq("posts.status", "active");

  // popular_count 는 관리자가 매긴 순위(작을수록 상위), 미지정은 NULL → 뒤로.
  // 부모 컬럼(created_at)으로는 2차 정렬을 못 걸어 post_id 내림차순(≈ 최신순)으로 근사한다.
  query = query
    .order("popular_count", { ascending: true, nullsFirst: false })
    .order("post_id", { ascending: false });

  if (filter.targetIds !== undefined) {
    if (filter.targetIds.length === 0) return { posts: [], total: 0 };
    query = query.in("post_id", filter.targetIds);
  }
  if (filter.userId) query = query.eq("posts.user_id", filter.userId);
  if (filter.search) query = query.ilike("posts.title", `%${filter.search}%`);
  if (filter.employeeType) query = query.eq("employee_type", filter.employeeType);
  if (filter.salaryType) query = query.eq("salary_type", filter.salaryType);
  if (filter.location) query = query.eq("location_type", filter.location as TradeLocation);

  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    query = query.range(from, from + pagination.pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  type Row = Record<string, unknown> & { posts: Record<string, unknown> };
  const posts = ((data ?? []) as unknown as Row[]).map((row) => {
    const { posts: post, ...job } = row;
    return { ...post, jobs: [job] };
  });

  return { posts: posts as unknown as JobWithPost[], total: count ?? 0 };
}

async function getJobListByDeadline(
  filter: JobListFilter,
  pagination: Pagination | undefined,
): Promise<PagedResult<JobWithPost>> {
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select(
      "*, posts!inner(*, users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at))",
      { count: "exact" },
    )
    .eq("posts.post_type", "jobs")
    .eq("posts.status", "active");

  // deadline(YYYY-MM-DD) 이 오늘 이후인 공고만 → 마감 지난 건 제외.
  // 마감 임박(오름차순) 정렬, 부모 컬럼 2차 정렬 불가라 post_id 내림차순(≈ 최신순)으로 근사.
  const today = new Date().toISOString().slice(0, 10);
  query = query
    .gte("deadline", today)
    .order("deadline", { ascending: true })
    .order("post_id", { ascending: false });

  if (filter.targetIds !== undefined) {
    if (filter.targetIds.length === 0) return { posts: [], total: 0 };
    query = query.in("post_id", filter.targetIds);
  }
  if (filter.userId) query = query.eq("posts.user_id", filter.userId);
  if (filter.search) query = query.ilike("posts.title", `%${filter.search}%`);
  if (filter.employeeType) query = query.eq("employee_type", filter.employeeType);
  if (filter.salaryType) query = query.eq("salary_type", filter.salaryType);
  if (filter.location) query = query.eq("location_type", filter.location as TradeLocation);

  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    query = query.range(from, from + pagination.pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  type Row = Record<string, unknown> & { posts: Record<string, unknown> };
  const posts = ((data ?? []) as unknown as Row[]).map((row) => {
    const { posts: post, ...job } = row;
    return { ...post, jobs: [job] };
  });

  return { posts: posts as unknown as JobWithPost[], total: count ?? 0 };
}
