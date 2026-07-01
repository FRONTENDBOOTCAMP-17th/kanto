"use server";

import { createClient } from "@/utils/supabase/server";
import { getMessageList, postMessage } from "@/services/chat/message";
import { isBlockedPair, hasBlockedUser } from "@/services/chat/block";
import type { MessageWithSender } from "@/type/chat/message";

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

// 양방향 차단 여부(blocked)와 내가 차단했는지(iBlocked)를 함께 반환한다.
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

export async function checkUserSuspendedAction(partnerId: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("suspended_until")
    .eq("id", partnerId)
    .single();
  if (!data?.suspended_until) return false;
  return new Date(data.suspended_until) > new Date();
}

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

  const { data: chat } = await supabase
    .from("chats")
    .select("user_id_1, user_id_2, user_id_1_left, user_id_2_left")
    .eq("id", params.chatId)
    .single();
  if (!chat) throw new Error("채팅을 찾을 수 없습니다.");

  const isUser1 = chat.user_id_1 === userData.id;
  const partnerId = isUser1 ? chat.user_id_2 : chat.user_id_1;

  if (partnerId !== null) {
    const { data: partnerData } = await supabase
      .from("users")
      .select("suspended_until")
      .eq("id", partnerId)
      .single();
    if (partnerData?.suspended_until && new Date(partnerData.suspended_until) > new Date()) {
      throw new Error("정지된 사용자입니다.");
    }

    if (await isBlockedPair(userData.id, partnerId)) {
      throw new Error("차단된 사용자와는 메시지를 주고받을 수 없습니다.");
    }
  }

  const result = await postMessage(
    { ...params, senderId: userData.id },
    supabase,
  );

  // 새 메시지가 오가면 (차단 해제 후 재대화 포함) 양쪽 모두에게 채팅을 다시 노출한다.
  const revive: { user_id_1_left?: boolean; user_id_2_left?: boolean } = {};
  if (chat.user_id_1_left) revive.user_id_1_left = false;
  if (chat.user_id_2_left) revive.user_id_2_left = false;
  if (Object.keys(revive).length > 0) {
    await supabase.from("chats").update(revive).eq("id", params.chatId);
  }

  return result;
}

export async function loadMoreMessagesAction(chatId: number, before: string) {
  const supabase = await createClient();
  return getMessageList(chatId, supabase, before);
}

export async function createChatAndSendAction(params: {
  partnerUserId: number;
  postId: number;
  content: string;
}): Promise<{ chatId: number; message: MessageWithSender }> {
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

  if (await isBlockedPair(userData.id, params.partnerUserId)) {
    throw new Error("차단된 사용자와는 메시지를 주고받을 수 없습니다.");
  }

  const { data: existing } = await supabase
    .from("chats")
    .select("id")
    .or(
      `and(user_id_1.eq.${userData.id},user_id_2.eq.${params.partnerUserId}),and(user_id_1.eq.${params.partnerUserId},user_id_2.eq.${userData.id})`,
    )
    .eq("post_id", params.postId)
    .maybeSingle();

  let chatId: number;
  if (existing) {
    chatId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from("chats")
      .insert({ user_id_1: userData.id, user_id_2: params.partnerUserId, post_id: params.postId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    chatId = created.id;
  }

  const message = await postMessage(
    { chatId, senderId: userData.id, postId: params.postId, content: params.content },
    supabase,
  );

  return { chatId, message: message as MessageWithSender };
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

  await supabase.rpc("mark_chat_read", {
    p_chat_id: chatId,
    p_user_id: userData.id,
  });
}
