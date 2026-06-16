"use server";

import { createClient } from "@/utils/supabase/server";
import { getMessageList, postMessage } from "@/services/chat/message";

export async function sendMessageAction(params: {
  chatId: number;
  postId: number;
  content: string;
}) {
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

  if (!userData) throw new Error("사용자를 찾을 수 없습니다.");

  const result = await postMessage(
    { ...params, senderId: userData.id },
    supabase,
  );

  const { data: chat } = await supabase
    .from("chats")
    .select("user_id_1, user_id_1_left, user_id_2_left")
    .eq("id", params.chatId)
    .single();

  if (chat) {
    const isUser1 = chat.user_id_1 === userData.id;
    if (isUser1 && chat.user_id_2_left) {
      await supabase
        .from("chats")
        .update({ user_id_2_left: false })
        .eq("id", params.chatId);
    } else if (!isUser1 && chat.user_id_1_left) {
      await supabase
        .from("chats")
        .update({ user_id_1_left: false })
        .eq("id", params.chatId);
    }
  }

  return result;
}

// 이전 메시지 페이지네이션 로드
// before: 현재 화면에서 가장 오래된 메시지의 created_at (커서)
// before 기준 이전 50개를 오름차순으로 반환
export async function loadMoreMessagesAction(chatId: number, before: string) {
  const supabase = await createClient();
  return getMessageList(chatId, supabase, before);
}

export async function markChatReadAction(chatId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) return;

  const { data: chat } = await supabase
    .from("chats")
    .select("user_id_1")
    .eq("id", chatId)
    .single();
  if (!chat) return;

  const isUser1 = chat.user_id_1 === userData.id;
  await supabase
    .from("chats")
    .update(isUser1 ? { user_id_1_unread: 0 } : { user_id_2_unread: 0 })
    .eq("id", chatId);
}
