import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { MessageWithSender } from "@/type/chat/message";

const MESSAGE_SELECT = `*,
    sender:users!messages_sender_id_fkey(id, name, avatar_url, created_at)`;

// 메시지 조회
export async function getMessage(
  chatId: number,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<MessageWithSender[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as MessageWithSender[];
}

// 메시지 보내기
export async function postMessage(
  params: {
    chatId: number;
    senderId: number;
    postId: number;
    content: string;
  },
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: params.chatId,
      sender_id: params.senderId,
      post_id: params.postId,
      content: params.content,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // 메시지 보내기 이후에 마지막 메시지 시간 업데이트
  await supabase
    .from("chats")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_content: params.content,
    })
    .eq("id", params.chatId);

  return data;
}
