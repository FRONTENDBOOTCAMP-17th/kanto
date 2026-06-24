import { createClient } from "@/utils/supabase/server";
import { MessageWithSender } from "@/type/chat/message";

const MESSAGE_SELECT = `id, content, sender_id, chat_id, post_id, is_read, type, created_at, transaction_id,
    sender:users!messages_sender_id_fkey(id, name, avatar_url, created_at)`;

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

  const messages = (data as MessageWithSender[]).reverse();

  const paymentIds = messages
    .filter((m) => m.type === "payment" && m.transaction_id != null)
    .map((m) => m.transaction_id as number);

  if (paymentIds.length > 0) {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .in("id", paymentIds);

    if (transactions) {
      const txMap = new Map(transactions.map((t) => [t.id, t]));
      messages.forEach((m) => {
        if (m.transaction_id != null) m.transaction = txMap.get(m.transaction_id) ?? null;
      });
    }
  }

  return messages;
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
