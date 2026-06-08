import type { Tables } from "@/type/supabase";
import type { SellerInfo } from "../user";
import type { Post } from "../post";
import type { Message } from "./message";

export type Chat = Tables<"chats">;

export interface ChatWithUsers extends Chat {
  user1: SellerInfo;
  user2: SellerInfo;
  posts: Pick<Post, "title" | "post_type"> | null;
  messages: Pick<Message, "content" | "is_read" | "created_at">[] | null;
}
