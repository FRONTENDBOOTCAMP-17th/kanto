"use client";

import type { SellerInfo } from "@/type/user";
import type { PendingNewChat } from "@/store/chatStore";
import { useChatRoomData } from "./_hooks/useChatRoomData";
import Skeleton from "./_components/Skeleton";
import Content from "./_components/Content";

interface ChatRoomProps {
  chatId: number | null;
  newChatMeta?: PendingNewChat;
  currentUserOverride?: SellerInfo;
}

export default function ChatRoom({
  chatId,
  newChatMeta,
  currentUserOverride,
}: ChatRoomProps) {
  const data = useChatRoomData(chatId, newChatMeta, currentUserOverride);

  if (!data) return <Skeleton />;

  return (
    <Content
      key={data.chatId ?? `new-${data.postId}-${data.partner.id}`}
      data={data}
    />
  );
}
