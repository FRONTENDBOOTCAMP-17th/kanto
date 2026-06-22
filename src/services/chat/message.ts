import { createClient } from "@/utils/supabase/server";
import { MessageWithSender } from "@/type/chat/message";

const MESSAGE_SELECT = `*,
    sender:users!messages_sender_id_fkey(id, name, avatar_url, created_at),
    transaction:transactions!messages_transaction_id_fkey(*)`;

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

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data as MessageWithSender[]).reverse();
}

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
    .select("user_id_1")
    .eq("id", params.chatId)
    .single();

  const isUser1 = chat?.user_id_1 === params.senderId;

  await supabase.rpc("increment_unread", {
    p_chat_id: params.chatId,
    p_for_user1: !isUser1,
  });

  await supabase
    .from("chats")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_content: params.content,
    })
    .eq("id", params.chatId);

  return data;
}
