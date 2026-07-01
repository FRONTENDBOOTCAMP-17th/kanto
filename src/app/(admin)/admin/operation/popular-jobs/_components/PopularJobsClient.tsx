"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, ChevronLeft, Search, X, ShieldAlert } from "lucide-react";

type JobRow = {
  id: number;
  title: string;
  created_at: string;
  jobs: { id: number; company_name: string; popular_count: number | null }[];
};

const RANK_OPTIONS = [1, 2, 3, 4, 5] as const;

export function PopularJobsClient({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [rows, setRows] = useState<JobRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    setRows(null);
    const params = query ? `?search=${encodeURIComponent(query)}` : "";
    fetch(`/api/admin/popular-jobs${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      });
    return () => { cancelled = true; };
  }, [query, isSuperAdmin]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search.trim());
  }

  function clearSearch() {
    setSearch("");
    setQuery("");
  }

  async function handleRankChange(row: JobRow, newCount: number | null) {
    const jobId = row.jobs[0]?.id;
    if (!jobId) return;
    setSaving(row.id);

    const res = await fetch("/api/admin/popular-jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: jobId,
        popular_count: newCount,
        post_title: row.title,
      }),
    });

    if (res.ok) {
      setRows((prev) =>
        (prev ?? []).map((r) =>
          r.id === row.id
            ? {
                ...r,
                jobs: r.jobs.map((j) =>
                  j.id === jobId ? { ...j, popular_count: newCount } : j,
                ),
              }
            : r,
        ),
      );
    }
    setSaving(null);
  }

  const assignedCounts = new Set(
    (rows ?? []).flatMap((r) =>
      r.jobs
        .map((j) => j.popular_count)
        .filter((c): c is number => c !== null),
    ),
  );

  return (
    <>
      {!isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-[#ebeef0] bg-white p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.14)]">
            <button
              onClick={() => window.history.back()}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <ShieldAlert className="h-7 w-7 text-amber-500" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[17px] font-bold text-slate-900">슈퍼어드민 전용입니다</p>
              <p className="mt-1.5 text-[13.5px] text-slate-400">이 페이지는 슈퍼어드민만 접근할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-7">
          <Link
            href="/admin/operation"
            className="mb-2 flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            운영 관리
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50">
              <TrendingUp className="h-5 w-5 text-teal-600" strokeWidth={2} />
            </div>
            <h1 className="text-[22px] font-bold text-slate-900 sm:text-[24px]">인기 관리</h1>
          </div>
          <p className="mt-1 text-[13px] text-slate-500">
            구인구직 게시글의 인기 순위(1~5위)를 직접 지정합니다. 미지정 시 인기글에 노출되지 않습니다.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-5 flex gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="게시글 제목으로 검색"
              className="w-full rounded-xl border border-[#ebeef0] bg-white py-2 pl-9 pr-9 text-[13.5px] text-slate-800 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-teal-500 px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-teal-600"
          >
            검색
          </button>
        </form>

        {rows === null ? (
          <div className="flex justify-center py-20 text-[14px] text-slate-400">불러오는 중...</div>
        ) : rows.length === 0 ? (
          <div className="flex justify-center py-20 text-[14px] text-slate-400">
            {query ? "검색 결과가 없습니다." : "활성 구인구직 게시글이 없습니다."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <table className="w-full min-w-[520px] text-[13.5px]">
              <thead>
                <tr className="border-b border-[#ebeef0] bg-slate-50 text-left text-[12px] font-semibold text-slate-500">
                  <th className="px-4 py-3 sm:px-5">게시글 제목</th>
                  <th className="px-4 py-3 sm:px-5 whitespace-nowrap">회사명</th>
                  <th className="hidden px-4 py-3 sm:table-cell sm:px-5 whitespace-nowrap">등록일</th>
                  <th className="px-4 py-3 sm:px-5 whitespace-nowrap text-center">인기 순위</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const job = row.jobs[0];
                  const current = job?.popular_count ?? null;
                  const isSaving = saving === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={[
                        "border-b border-[#ebeef0] transition-colors last:border-0",
                        current !== null ? "bg-teal-50/40" : "hover:bg-slate-50/60",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3 sm:px-5">
                        <span className="line-clamp-1 font-medium text-slate-800">
                          {row.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-5 whitespace-nowrap text-slate-600">
                        {job?.company_name ?? "-"}
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell sm:px-5 whitespace-nowrap text-slate-400">
                        {new Date(row.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex items-center justify-center gap-1">
                          {RANK_OPTIONS.map((rank) => {
                            const isSelected = current === rank;
                            const isTakenByOther = assignedCounts.has(rank) && !isSelected;
                            return (
                              <button
                                key={rank}
                                disabled={isSaving || isTakenByOther}
                                onClick={() => handleRankChange(row, isSelected ? null : rank)}
                                title={
                                  isTakenByOther
                                    ? `${rank}위는 이미 다른 게시글에 지정됨`
                                    : isSelected
                                    ? "클릭하면 해제"
                                    : `${rank}위로 지정`
                                }
                                className={[
                                  "flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-bold transition-all",
                                  isSelected
                                    ? "bg-teal-500 text-white shadow-sm"
                                    : isTakenByOther
                                    ? "cursor-not-allowed bg-slate-100 text-slate-300"
                                    : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-teal-50 hover:text-teal-600 hover:ring-teal-300",
                                  isSaving ? "opacity-50" : "",
                                ].join(" ")}
                              >
                                {rank}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
