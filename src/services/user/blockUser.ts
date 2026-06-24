"use server";

import { createClient } from "@/utils/supabase/server";

// 채팅방과 무관하게 유저를 차단한다. (chats 테이블은 건드리지 않음)
// 채팅방 내 차단은 채팅 나감 처리까지 필요하므로 blockUserAction(chatId, ...)을 그대로 사용한다.
export async function blockUserStandaloneAction(blockedId: number) {
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
  if (userData.id === blockedId)
    throw new Error("자기 자신은 차단할 수 없습니다.");

  await supabase
    .from("user_blocks")
    .upsert(
      { blocker_id: userData.id, blocked_id: blockedId },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true },
    );
}
