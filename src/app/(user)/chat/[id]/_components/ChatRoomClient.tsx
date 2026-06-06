"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import { sendMessageAction } from "../actions";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import { useChatRoomRealtime } from "@/hooks/chat/useChatRoomRealtime";
import { useChatMessages } from "@/hooks/chat/useChatMessages";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

interface Props {
  initialMessages: MessageWithSender[];
  currentUser: SellerInfo;
  chatId: number;
  postId: number;
  partner: SellerInfo;
  postTitle: string;
}

export default function ChatRoomClient({
  initialMessages,
  currentUser,
  chatId,
  postId,
  partner,
  postTitle,
}: Props) {
  const router = useRouter();
  const [input, setInput] = useState("");

  const { isCooldown, cooldownSeconds, recordSend } = useSpamPrevention();
  const {
    messages,
    setMessages,
    hasMore,
    isLoadingMore,
    loadMore,
    messagesEndRef,
    scrollContainerRef,
  } = useChatMessages({ initialMessages, currentUser, chatId, partner });

  useChatRoomRealtime({ chatId, currentUser, partner, setMessages });

  const handleSend = async () => {
    if (!input.trim()) return;

    if (recordSend()) {
      setInput("");
      return;
    }

    const content = input.trim();
    setInput("");

    const optimistic: MessageWithSender = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      chat_id: chatId,
      sender_id: currentUser.id,
      post_id: postId,
      content,
      is_read: false,
      sender: currentUser,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendMessageAction({ chatId, postId, content });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ChatHeader
        partner={partner}
        postTitle={postTitle}
        onBack={() => router.back()}
      />
      <MessageList
        messages={messages}
        currentUser={currentUser}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        messagesEndRef={messagesEndRef}
        scrollContainerRef={scrollContainerRef}
      />
      <ChatInput
        input={input}
        onChange={setInput}
        onSend={handleSend}
        isCooldown={isCooldown}
        cooldownSeconds={cooldownSeconds}
      />
    </div>
  );
}
