"use client";

import ChatRoomClient from "./ChatRoomClient";
import { MessageWithSender } from "@/type/chat/message";
import { SellerInfo } from "@/type/user";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ChatRoomData {
  messages: MessageWithSender[];
  currentUser: SellerInfo;
  chatId: number;
  postId: number;
  partner: SellerInfo;
  postTitle: string;
}

export default function ChatRoom({
  chatId,
  onBack,
  onLeave,
}: {
  chatId: number;
  onBack?: () => void;
  onLeave?: () => void;
}) {
  const t = useTranslations("Chat");
  const [data, setData] = useState<ChatRoomData | null>(null);

  useEffect(() => {
    fetch(`/api/chat/${chatId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        setData(json);
      });
  }, [chatId]);

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
    />
  );
}
