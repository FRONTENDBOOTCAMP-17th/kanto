import { createAdminClient } from "@/utils/supabase/admin";
import { supabase } from "@/lib/supabase";

export interface BlockedUser {
  id: number;
  name: string;
  avatar_url: string | null;
}

export async function getBlockedUsers(userId: number): Promise<BlockedUser[]> {
  const { data } = await supabase
    .from("user_blocks")
    .select("blocked:public_profiles!user_blocks_blocked_id_fkey(id, name, avatar_url)")
    .eq("blocker_id", userId);

  return (data ?? [])
    .map((r) => r.blocked as unknown as BlockedUser | null)
    .filter((u): u is BlockedUser => u !== null);
}

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
