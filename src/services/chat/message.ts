import { createClient } from "@/utils/supabase/server";
import { MessageWithSender } from "@/type/chat/message";

const MESSAGE_SELECT = `*,
    sender:users!messages_sender_id_fkey(id, name, avatar_url, created_at),
    transaction:transactions!messages_transaction_id_fkey(*)`;

// 메시지 조회
export async function getMessageList(
  chatId: number,
  supabase: Awaited<ReturnType<typeof createClient>>,
  before?: string,
): Promise<MessageWithSender[]> {
  let query = supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("chat_id", chatId);

  if (before) {
    query = query.lt("created_at", before);
  }

  // 대화 50개씩 짤라서 가져오기
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  // 최신대화 순으로 뒤집음
  return (data as MessageWithSender[]).reverse();
}

// 메시지 보내기
export async function postMessage(
  params: {
    chatId: number;
    senderId: number;
    postId: number;
    content: string;
    type?: string;
    transactionId?: number;
  },
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: params.chatId,
      sender_id: params.senderId,
      post_id: params.postId,
      content: params.content,
      is_read: false,
      type: params.type ?? "text",
      transaction_id: params.transactionId ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { data: chat } = await supabase
    .from("chats")
    .select("user_id_1, user_id_1_unread, user_id_2_unread")
    .eq("id", params.chatId)
    .single();

  const isUser1 = chat?.user_id_1 === params.senderId;
  const unreadUpdate = isUser1
    ? { user_id_2_unread: (chat?.user_id_2_unread ?? 0) + 1 }
    : { user_id_1_unread: (chat?.user_id_1_unread ?? 0) + 1 };

  // 메시지 보내기 이후에 마지막 메시지 시간 업데이트
  await supabase
    .from("chats")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_content: params.content,
      ...unreadUpdate,
    })
    .eq("id", params.chatId);

  return data;
}
