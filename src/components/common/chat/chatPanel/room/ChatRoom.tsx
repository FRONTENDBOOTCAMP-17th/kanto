"use client";

import ChatRoomClient from "./ChatRoomClient";
import { MessageWithSender } from "@/type/chat/message";
import { SellerInfo } from "@/type/user";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
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
  isSold: boolean;
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
        partner: { ...newChatMeta.partner, name: newChatMeta.partner.name ?? "" },
        postTitle: newChatMeta.postTitle,
        postType: newChatMeta.postType ?? "",
        sellerId: newChatMeta.sellerId,
        postPrice: newChatMeta.postPrice,
        isReserved: false,
        isSold: false,
      });
      return;
    }
    fetch(`/api/chat/${chatId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        setData({
          ...json,
          currentUser: { ...json.currentUser, name: json.currentUser.name ?? "" },
          partner: { ...json.partner, name: json.partner.name ?? "" },
        });
      });
  }, [chatId, newChatMeta, currentUserOverride]);

  if (!data)
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-32 h-4" />
        </div>
        <div className="flex-1 flex flex-col gap-3 px-4 py-4 overflow-hidden">
          <Skeleton className="w-2/5 h-9 rounded-2xl self-start" />
          <Skeleton className="w-1/2 h-9 rounded-2xl self-end" />
          <Skeleton className="w-1/3 h-9 rounded-2xl self-start" />
          <Skeleton className="w-2/5 h-9 rounded-2xl self-end" />
          <Skeleton className="w-1/4 h-9 rounded-2xl self-start" />
        </div>
        <div className="px-4 py-3 border-t border-gray-200 bg-white shrink-0">
          <Skeleton className="w-full h-10 rounded-full" />
        </div>
      </div>
    );

  return (
    <ChatRoomClient
      key={data.chatId ?? `new-${data.postId}-${data.partner.id}`}
      {...data}
      initialMessages={data.messages}
      onBack={onBack}
      onLeave={onLeave}
      onChatCreated={onChatCreated}
    />
  );
}
