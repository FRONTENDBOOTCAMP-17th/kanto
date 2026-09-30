"use server";

import { createClient } from "@/utils/supabase/server";
import { postMessage } from "@/services/chat/message";

export async function toggleReserveAction(postId: number, isReserved: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ is_reserved: isReserved })
    .eq("id", postId);
  if (error) throw error;
}

export async function sendReserveSystemMessageAction(postId: number, isReserved: boolean, chatId: number) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) throw new Error("사용자를 찾을 수 없습니다.");

  const content = isReserved
    ? "판매자가 예약중으로 변경했습니다"
    : "판매자가 예약중을 취소했습니다";

  await postMessage(
    { chatId, senderId: userData.id, postId, content, type: "system" },
    supabase,
  );
}
