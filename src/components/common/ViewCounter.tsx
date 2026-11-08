"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

// 상세 페이지가 정적(ISR)으로 캐시되므로 조회수는 서버 렌더링(after) 대신 브라우저에서 1회 올린다.
// JS를 실행하지 않는 크롤러 요청은 조회수에 포함되지 않는다.
export function ViewCounter({ postId }: { postId: number }) {
  const counted = useRef<number | null>(null);

  useEffect(() => {
    if (counted.current === postId) return;
    counted.current = postId;
    supabase.rpc("increment_view_count", { p_post_id: postId }).then(() => {});
  }, [postId]);

  return null;
}
