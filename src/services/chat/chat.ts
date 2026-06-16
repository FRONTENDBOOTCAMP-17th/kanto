import { createClient } from "@/utils/supabase/server";
import { ChatWithUsers } from "@/type/chat/chat";

const CHAT_SELECT = `*,
      user1:users!chats_user_id_1_fkey(id, name, avatar_url, created_at),
      user2:users!chats_user_id_2_fkey(id, name, avatar_url, created_at),
      posts(title, post_type)` as const;

// 목록 보기
export async function getChatList(
  currentUserId: number,
): Promise<ChatWithUsers[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chats")
    .select(CHAT_SELECT)
    .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
    // 채팅방에서 내가 user_id_1일수도 user_id_2 일수도 있기 때문에 둘다 확인
    .order("last_message_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter((chat) => {
    if (chat.user_id_1 === currentUserId) return !chat.user_id_1_left;
    return !chat.user_id_2_left;
  }) as ChatWithUsers[];
}

export async function getChatDetail(
  chatId: number,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ChatWithUsers> {
  const { data, error } = await supabase
    .from("chats")
    .select(CHAT_SELECT)
    .eq("id", chatId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ChatWithUsers;
}
