"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePostPages, type RevalidatablePostType } from "@/services/revalidatePost";

// 클라이언트에서 게시물을 직접 수정한 뒤 호출해 상세 페이지 ISR 캐시를 갱신한다.
export async function revalidatePostAfterEdit(postType: RevalidatablePostType) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return;
  revalidatePostPages(postType);
}
