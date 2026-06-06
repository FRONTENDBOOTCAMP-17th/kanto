import type { SellerInfo } from "../user";
import type { Post } from "../post";
import type { Message } from "./message";

export interface Chat {
  id: number;
  created_at: string;
  user_id_1: number;
  user_id_2: number;
  last_message_at: string | null;
  last_message_content: string | null;
  post_id: number;
  user_id_1_unread: number | null;
  user_id_2_unread: number | null;
}

// Supabase JOIN 응답 구조에 맞춘 타입
// users → FK로 조인된 상대방 정보
// posts → 게시글 제목, 카테고리
// messages → 해당 채팅방의 메시지 목록
export interface ChatWithUsers extends Chat {
  user1: SellerInfo;
  user2: SellerInfo;
  posts: Pick<Post, "title" | "post_type"> | null;
  messages: Pick<Message, "content" | "is_read" | "created_at">[] | null;
}
