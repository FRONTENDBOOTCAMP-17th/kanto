"use client";

import ChatRoomClient from "./ChatRoomClient";
import { MessageWithSender } from "@/type/chat/message";
import { SellerInfo } from "@/type/user";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { PendingNewChat } from "@/store/chatStore";

interface ChatRoomData {
  messages: MessageWithSender[];
  currentUser: SellerInfo;
  chatId: number | null;
  postId: number;
  partner: SellerInfo;
  postTitle: string;
  postType: string;
  sellerId: number | null;
  postPrice: number | null;
  isReserved: boolean;
}

export default function ChatRoom({
  chatId,
  newChatMeta,
  currentUserOverride,
  onBack,
  onLeave,
  onChatCreated,
}: {
  chatId: number | null;
  newChatMeta?: PendingNewChat;
  currentUserOverride?: SellerInfo;
  onBack?: () => void;
  onLeave?: () => void;
  onChatCreated?: (chatId: number) => void;
}) {
  const t = useTranslations("Chat");
  const [data, setData] = useState<ChatRoomData | null>(null);

  useEffect(() => {
    if (chatId === null) {
      if (!newChatMeta || !currentUserOverride) return;
      setData({
        messages: [],
        currentUser: currentUserOverride,
        chatId: null,
        postId: newChatMeta.postId,
        partner: newChatMeta.partner,
        postTitle: newChatMeta.postTitle,
        postType: newChatMeta.postType ?? "",
        sellerId: newChatMeta.sellerId,
        postPrice: newChatMeta.postPrice,
        isReserved: false,
      });
      return;
    }
    fetch(`/api/chat/${chatId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        setData(json);
      });
  }, [chatId, newChatMeta, currentUserOverride]);

  if (!data)
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        {t("loading")}
      </div>
    );

  return (
    <ChatRoomClient
      {...data}
      initialMessages={data.messages}
      onBack={onBack}
      onLeave={onLeave}
      onChatCreated={onChatCreated}
    />
  );
}
