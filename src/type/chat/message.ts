import type { SellerInfo } from "../user";

export interface Message {
  id: number;
  created_at: string;
  chat_id: number;
  sender_id: number;
  post_id: number;
  content: string;
  is_read: boolean;
}

export interface MessageWithSender extends Message {
  sender: SellerInfo;
}
// sender 판매자 정보(즉 채팅을 받는 사람이 됩니다.)