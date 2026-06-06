import { loadMoreMessagesAction } from "@/app/(user)/chat/[id]/actions";
import { MessageWithSender } from "@/type/chat/message";
import { SellerInfo } from "@/type/user";
import { useEffect, useRef, useState } from "react";

interface Props {
  initialMessages: MessageWithSender[];
  currentUser: SellerInfo;
  chatId: number;
  partner: SellerInfo;
}

export function useChatMessages({
  initialMessages,
  currentUser,
  chatId,
  partner,
}: Props) {
  const [messages, setMessages] =
    useState<MessageWithSender[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wasLoadingMore = useRef(false);

  useEffect(() => {
    if (wasLoadingMore.current) {
      wasLoadingMore.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore || messages.length === 0) return;
    setIsLoadingMore(true);

    const oldest = messages[0].created_at;
    const data = await loadMoreMessagesAction(chatId, oldest);

    if (data.length === 0) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    // sender 정보를 currentUser/partner로 매핑
    const older: MessageWithSender[] = data.map((msg) => ({
      ...msg,
      sender: msg.sender_id === currentUser.id ? currentUser : partner,
    }));

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    wasLoadingMore.current = true;
    setMessages((prev) => [...older, ...prev]);
    setHasMore(data.length === 50);
    setIsLoadingMore(false);

    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      }
    });
  };
  return {
    messages,
    setMessages,
    hasMore,
    setHasMore,
    isLoadingMore,
    loadMore,
    messagesEndRef,
    scrollContainerRef,
  };
}
