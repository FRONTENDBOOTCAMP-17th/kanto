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
