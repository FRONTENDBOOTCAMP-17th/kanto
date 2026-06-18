import { createAdminClient } from "@/utils/supabase/admin";

// userId와 otherUserId 중 한쪽이라도 상대를 차단했으면 true
// 차단당한 쪽은 RLS상 차단 row를 조회할 수 없으므로 admin 클라이언트로 우회 조회한다.
export async function isBlockedPair(userId: number, otherUserId: number) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("user_blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`,
    )
    .limit(1)
    .maybeSingle();
  return !!data;
}
