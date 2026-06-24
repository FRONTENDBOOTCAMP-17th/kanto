import type { Tables } from "@/type/supabase";
import type { SellerInfo } from "@/type/user";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

export type GroupChatRoom = Tables<"meetup_chat_rooms">;
export type GroupMessage = Tables<"meetup_chat_messages">;

export interface GroupMessageWithSender extends GroupMessage {
  sender: SellerInfo;
  tempId?: number;
}

// "내 모임 채팅" 목록 1행
export interface MyGroupRoom {
  room_id: number;
  meetup_post_id: number;
  title: string; // posts.title
  topic: MeetupTopicKey;
  status: "active" | "ended";
  last_message_content: string | null;
  last_message_at: string | null;
  unread_count: number;
}
