"use client";

import { useEffect, useMemo, useState } from "react";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import type { PendingNewChat } from "@/store/chatStore";

export interface ChatRoomData {
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

export function useChatRoomData(
  chatId: number | null,
  newChatMeta?: PendingNewChat,
  currentUserOverride?: SellerInfo,
): ChatRoomData | null {
  const newChatData = useMemo<ChatRoomData | null>(() => {
    if (chatId !== null || !newChatMeta || !currentUserOverride) return null;
    return {
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
    };
  }, [chatId, newChatMeta, currentUserOverride]);

  const [fetchedData, setFetchedData] = useState<ChatRoomData | null>(null);

  useEffect(() => {
    if (chatId === null) return;
    fetch(`/api/chat/${chatId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        setFetchedData({
          ...json,
          currentUser: { ...json.currentUser, name: json.currentUser.name ?? "" },
          partner: { ...json.partner, name: json.partner.name ?? "" },
        });
      });
  }, [chatId]);

  return newChatData ?? fetchedData;
}
