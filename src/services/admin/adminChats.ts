import { createAdminClient } from "@/utils/supabase/admin";

export async function getAdminChatRooms() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chats")
    .select(`
      id,
      created_at,
      last_message_at,
      last_message_content,
      user1:users!chats_user_id_1_fkey(id, name, suspended_until),
      user2:users!chats_user_id_2_fkey(id, name, suspended_until),
      posts(title, post_type)
    `)
    .order("last_message_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAdminChatMessages(chatId: number, before?: string) {
  const admin = createAdminClient();

  let query = admin
    .from("messages")
    .select(`
      id,
      content,
      created_at,
      sender:users!messages_sender_id_fkey(id, name)
    `)
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, error } = await query;
  if (error) throw error;
  return (messages ?? []).reverse();
}
