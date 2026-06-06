import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ChatWithUsers } from "@/type/chat/chat";

// 목록용: messages 제외 (RLS 이슈 + 목록엔 last_message_at으로 충분)
const CHAT_LIST_SELECT = `*,
      user1:users!chats_user_id_1_fkey(id, name, avatar_url, created_at),
      user2:users!chats_user_id_2_fkey(id, name, avatar_url, created_at),
      posts(title, post_type)` as const;

// 상세용: messages는 getMessage()로 별도 조회
const CHAT_DETAIL_SELECT = `*,
      user1:users!chats_user_id_1_fkey(id, name, avatar_url, created_at),
      user2:users!chats_user_id_2_fkey(id, name, avatar_url, created_at),
      posts(title, post_type)` as const;

// 목록 보기
export async function getChatList(
  currentUserId: number,
): Promise<ChatWithUsers[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("chats")
    .select(CHAT_LIST_SELECT)
    .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
    // 채팅방에서 내가 user_id_1일수도 user_id_2 일수도 있기 때문에 둘다 확인
    .order("last_message_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as ChatWithUsers[];
}

export async function getChatRoom(
  chatId: number,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<ChatWithUsers> {
  const { data, error } = await supabase
    .from("chats")
    .select(CHAT_DETAIL_SELECT)
    .eq("id", chatId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ChatWithUsers;
}

// 목록, 상세보기

// 목록
// 판매자 정보(판매자 닉네임, 판매자 avarta), 마지막 시간, 마지막 텍스트, post 카테고리

// 상세보기
// 판매자 정보(판매자 닉네임, 판매자 아바타), post 제목, (읽음, 안읽음)
