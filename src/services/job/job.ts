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

interface JobFilterColumns {
  userId: string;
  title: string;
  employeeType: string;
  salaryType: string;
  location: string;
}

const POSTS_BASED_COLUMNS: JobFilterColumns = {
  userId: "user_id",
  title: "title",
  employeeType: "jobs.employee_type",
  salaryType: "jobs.salary_type",
  location: "jobs.location_type",
};

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
  if (filter?.sort === "popular") {
    return getJobListByPopular(filter, pagination);
  }
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
