"use server";

import { createClient } from "@/utils/supabase/server";

export async function blockMemberAction(blockedId: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) throw new Error("유저를 찾을 수 없습니다.");

  await supabase
    .from("user_blocks")
    .upsert(
      { blocker_id: userData.id, blocked_id: blockedId },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true },
    );
}

export async function unblockMemberAction(blockedId: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) throw new Error("유저를 찾을 수 없습니다.");

  await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", userData.id)
    .eq("blocked_id", blockedId);
}
