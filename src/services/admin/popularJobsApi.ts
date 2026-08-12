export type PopularJobRow = {
  id: number;
  title: string;
  created_at: string;
  jobs: { id: number; company_name: string; popular_count: number | null }[];
};

export async function getPopularJobs(search: string): Promise<PopularJobRow[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`/api/admin/popular-jobs${params}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function updatePopularRank(payload: {
  jobId: number;
  popularCount: number | null;
  postTitle: string;
}): Promise<boolean> {
  const res = await fetch("/api/admin/popular-jobs", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_id: payload.jobId,
      popular_count: payload.popularCount,
      post_title: payload.postTitle,
    }),
  });
  return res.ok;
}
