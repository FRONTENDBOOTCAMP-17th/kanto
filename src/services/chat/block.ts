import { createAdminClient } from "@/utils/supabase/admin";

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

// blockerId가 blockedId를 차단했는지 (방향성 있는 확인)
export async function hasBlockedUser(blockerId: number, blockedId: number) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("user_blocks")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .limit(1)
    .maybeSingle();
  return !!data;
}
