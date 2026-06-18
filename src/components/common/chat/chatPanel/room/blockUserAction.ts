"use server";

import { createClient } from "@/utils/supabase/server";

export async function blockUserAction(chatId: number, blockedId: number) {
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

  const { data: chat } = await supabase
    .from("chats")
    .select("user_id_1")
    .eq("id", chatId)
    .single();
  if (!chat) throw new Error("채팅을 찾을 수 없습니다.");

  const isUser1 = chat.user_id_1 === userData.id;
  await supabase
    .from("chats")
    .update(isUser1 ? { user_id_1_left: true } : { user_id_2_left: true })
    .eq("id", chatId);
}
