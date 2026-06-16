"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import { markChatReadAction, sendMessageAction } from "./actions";
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
  onBack?: () => void;
  onLeave?: () => void;
}

export default function ChatRoomClient({
  initialMessages,
  currentUser,
  chatId,
  postId,
  partner,
  postTitle,
  onBack,
  onLeave
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

    const tempId = Date.now();
    const optimistic: MessageWithSender = {
      id: tempId,
      created_at: new Date().toISOString(),
      chat_id: chatId,
      sender_id: currentUser.id,
      post_id: postId,
      content,
      is_read: false,
      sender: currentUser,
      tempId,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const saved = await sendMessageAction({ chatId, postId, content });
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId ? { ...m, id: saved.id, tempId: undefined } : m,
        ),
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
    }
  };

  useEffect(() => {
    markChatReadAction(chatId);
  }, [chatId]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      <ChatHeader
        partner={partner}
        postTitle={postTitle}
        chatId={chatId}
        onBack={onBack ?? (() => router.back())}
        onLeave={onLeave}
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
