"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { REPORTS_TABLE } from "@/constants/report";

// 게시물 상세(ISR) 페이지에서 로그인 사용자의 좋아요·신고 여부를 클라이언트에서 조회한다.
// (기존: 서버 getUserLikeReportStatus → 페이지가 매 요청 동적 렌더링됨)
export function useViewerPostStatus(postId: number) {
  const userId = useAuthStore((s) => s.user?.id);
  const authReady = useAuthStore((s) => s.authReady);

  const { data } = useQuery({
    queryKey: ["viewer-post-status", postId, userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: like }, { data: report }] = await Promise.all([
        supabase
          .from("common_likes")
          .select("id")
          .eq("target_id", postId)
          .eq("target_type", "post")
          .eq("user_id", userId!)
          .maybeSingle(),
        supabase
          .from(REPORTS_TABLE)
          .select("id")
          .eq("target_id", postId)
          .eq("target_type", "post")
          .eq("user_id", userId!)
          .maybeSingle(),
      ]);
      return { liked: !!like, reported: !!report };
    },
  });

  return {
    userId,
    authReady,
    liked: data?.liked ?? false,
    reported: data?.reported ?? false,
  };
}
