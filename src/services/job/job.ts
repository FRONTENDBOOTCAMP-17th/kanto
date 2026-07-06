import { createClient } from "@/utils/supabase/server";
import type { JobWithPost } from "@/type/job/jobList";
import type { Pagination, PagedResult } from "@/services/usedGoods/usedGoods";
import { encryptPostId } from "@/utils/postIdCipher";

interface JobListFilter {
  search?: string;
  employeeType?: string;
  salaryType?: string;
  location?: string;
  targetIds?: number[];
  userId?: number;
  sort?: string;
}

// 목록 조회는 정렬에 따라 부모(posts) 기준과 자식(jobs) 기준으로 뒤집어 조회하는데,
// 그때 같은 필터라도 컬럼 이름 앞에 붙는 접두사가 달라진다(예: "jobs.employee_type" ↔ "employee_type").
// 두 경로가 서로 다른 규칙을 쓰다 한쪽만 고치는 실수를 막기 위해, 필터가 걸리는 컬럼 이름을
// 경로별로 한 곳에 모아두고 적용부는 공통 헬퍼(applyScalarFilters)로 통일한다.
interface JobFilterColumns {
  userId: string;
  title: string;
  employeeType: string;
  salaryType: string;
  location: string;
}

// posts(부모) 기준 조회: 최신순 경로.
const POSTS_BASED_COLUMNS: JobFilterColumns = {
  userId: "user_id",
  title: "title",
  employeeType: "jobs.employee_type",
  salaryType: "jobs.salary_type",
  location: "jobs.location_type",
};

// jobs(자식) 기준 조회: 인기순·마감일순 경로.
const JOBS_BASED_COLUMNS: JobFilterColumns = {
  userId: "posts.user_id",
  title: "posts.title",
  employeeType: "employee_type",
  salaryType: "salary_type",
  location: "location_type",
};

type JobFilterQuery<Q> = {
  eq(column: string, value: string | number): Q;
  ilike(column: string, pattern: string): Q;
};

// targetIds 는 빈 배열일 때 "결과 없음"으로 조기 반환해야 해서 호출부에 남기고,
// 나머지 스칼라 필터(userId·검색·고용형태·급여형태·지역)만 여기서 공통 적용한다.
function applyScalarFilters<Q extends JobFilterQuery<Q>>(
  query: Q,
  filter: JobListFilter,
  cols: JobFilterColumns,
): Q {
  if (filter.userId) query = query.eq(cols.userId, filter.userId);
  if (filter.search) query = query.ilike(cols.title, `%${filter.search}%`);
  if (filter.employeeType) query = query.eq(cols.employeeType, filter.employeeType);
  if (filter.salaryType) query = query.eq(cols.salaryType, filter.salaryType);
  if (filter.location) query = query.eq(cols.location, filter.location);
  return query;
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
  if (filter) query = applyScalarFilters(query, filter, POSTS_BASED_COLUMNS);

  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    query = query.range(from, from + pagination.pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const posts = ((data as unknown as JobWithPost[]) ?? []).map((p) => ({
    ...p,
    id_token: encryptPostId(p.id),
  }));

  return { posts, total: count ?? 0 };
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
  query = applyScalarFilters(query, filter, JOBS_BASED_COLUMNS);

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

  return {
    posts: (posts as unknown as JobWithPost[]).map((p) => ({
      ...p,
      id_token: encryptPostId(p.id),
    })),
    total: count ?? 0,
  };
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
  query = applyScalarFilters(query, filter, JOBS_BASED_COLUMNS);

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

  return {
    posts: (posts as unknown as JobWithPost[]).map((p) => ({
      ...p,
      id_token: encryptPostId(p.id),
    })),
    total: count ?? 0,
  };
}

export async function getPopularJobs(): Promise<JobWithPost[]> {
  const supabase = await createClient();


  const { data, error } = await supabase
    .from("posts")
    .select("*, jobs!inner(*), users:public_profiles!posts_user_id_fkey(id, name, avatar_url, created_at)")
    .eq("post_type", "jobs")
    .eq("status", "active")
    .not("jobs.popular_count", "is", null);

  if (error) throw new Error(error.message);

  type JobWithPopular = JobWithPost & {
    jobs: (JobWithPost["jobs"][number] & { popular_count: number | null })[];
  };


  return (data as unknown as JobWithPopular[])
    .sort(
      (a, b) =>
        (a.jobs[0].popular_count ?? 99) - (b.jobs[0].popular_count ?? 99),
    )
    .slice(0, 5)
    .map((p) => ({ ...p, id_token: encryptPostId(p.id) })) as unknown as JobWithPost[];
}
