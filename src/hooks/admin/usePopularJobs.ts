"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPopularJobs,
  updatePopularRank,
  type PopularJobRow,
} from "@/services/admin/popularJobsApi";

const POPULAR_JOBS_QUERY_KEY = "admin-popular-jobs";

export function usePopularJobs(isSuperAdmin: boolean) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search.trim());
  }

  function clearSearch() {
    setSearch("");
    setQuery("");
  }

  const { data: rows, isLoading: loading } = useQuery({
    queryKey: [POPULAR_JOBS_QUERY_KEY, query],
    queryFn: () => getPopularJobs(query),
    enabled: isSuperAdmin,
  });

  const rankMutation = useMutation({
    mutationFn: (vars: { rowId: number; jobId: number; popularCount: number | null; postTitle: string }) =>
      updatePopularRank({ jobId: vars.jobId, popularCount: vars.popularCount, postTitle: vars.postTitle }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [POPULAR_JOBS_QUERY_KEY] }),
  });

  function handleRankChange(row: PopularJobRow, newCount: number | null) {
    const job = row.jobs[0];
    if (!job) return;
    rankMutation.mutate({ rowId: row.id, jobId: job.id, popularCount: newCount, postTitle: row.title });
  }

  return {
    rows: rows ?? null,
    loading,
    search,
    setSearch,
    query,
    handleSearch,
    clearSearch,
    handleRankChange,
    savingRowId: rankMutation.isPending ? (rankMutation.variables?.rowId ?? null) : null,
  };
}
