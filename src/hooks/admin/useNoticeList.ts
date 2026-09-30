"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteNotice, getNotices } from "@/services/admin/adminNoticesApi";

export const NOTICES_QUERY_KEY = ["admin-notices"];

export function useNoticeList() {
  const queryClient = useQueryClient();

  const { data: notices = [], isLoading: loading } = useQuery({
    queryKey: NOTICES_QUERY_KEY,
    queryFn: getNotices,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTICES_QUERY_KEY }),
  });

  return { notices, loading, handleDelete: deleteMutation.mutate };
}
