"use server";

import { createClient } from "@/utils/supabase/server";
import { isBlockedPair, hasBlockedUser } from "@/services/chat/block";

export async function checkBlockedAction(partnerId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) return false;

  return isBlockedPair(userData.id, partnerId);
}

export async function getBlockStateAction(partnerId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blocked: false, iBlocked: false };

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) return { blocked: false, iBlocked: false };

  const [blocked, iBlocked] = await Promise.all([
    isBlockedPair(userData.id, partnerId),
    hasBlockedUser(userData.id, partnerId),
  ]);
  return { blocked, iBlocked };
}
