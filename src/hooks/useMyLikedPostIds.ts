"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export const MY_LIKED_POST_IDS_QUERY_KEY = ["likes", "my-post-ids"] as const;

// 정적(ISR) 페이지에서 로그인 사용자의 좋아요 게시물 id를 한 번만 조회해 카드들이 공유한다.
export function useMyLikedPostIds(enabled: boolean) {
  const userId = useAuthStore((s) => s.user?.id);
  const { data } = useQuery({
    queryKey: [...MY_LIKED_POST_IDS_QUERY_KEY, userId],
    enabled: enabled && !!userId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("common_likes")
        .select("target_id")
        .eq("user_id", userId!)
        .eq("target_type", "post");
      if (error) throw error;
      return new Set(data.map((l) => l.target_id));
    },
  });
  return data;
}
