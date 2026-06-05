import type { SellerInfo } from "../user";
import type { Post } from "../post";
import type { Message } from "./message";

export interface Chat {
  id: number;
  created_at: string;
  user_id_1: number;
  user_id_2: number;
  last_message_at: string | null;
  post_id: number;
}

export interface ChatWithUsers extends Chat {
  partner: SellerInfo;
  post: Pick<Post, "title">;
  last_message: Pick<Message, "content" | "is_read" | "created_at"> | null;
}