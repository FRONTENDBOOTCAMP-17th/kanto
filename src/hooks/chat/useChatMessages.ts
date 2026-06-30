import { loadMoreMessagesAction } from "@/components/common/chat/chatPanel/room/actions";
import { MessageWithSender } from "@/type/chat/message";
import { SellerInfo } from "@/type/user";
import { useEffect, useRef, useState } from "react";

interface Props {
  initialMessages: MessageWithSender[];
  currentUser: SellerInfo;
  chatId: number | null;
  partner: SellerInfo;
}

export function useChatMessages({
  initialMessages,
  currentUser,
  chatId,
  partner,
}: Props) {
  const safeMessages = initialMessages ?? [];
  const [messages, setMessages] = useState<MessageWithSender[]>(safeMessages);
  const [hasMore, setHasMore] = useState(safeMessages.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wasLoadingMore = useRef(false);
  const isInitialScroll = useRef(true);

  useEffect(() => {
    if (wasLoadingMore.current) {
      wasLoadingMore.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({
      behavior: isInitialScroll.current ? "instant" : "smooth",
    });
    isInitialScroll.current = false;
  }, [messages]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore || messages.length === 0 || chatId === null) return;
    setIsLoadingMore(true);

    const oldest = messages[0].created_at;
    const data = await loadMoreMessagesAction(chatId, oldest);

    if (data.length === 0) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    const older: MessageWithSender[] = data.map((msg) => ({
      ...msg,
      sender: msg.sender_id === currentUser.id ? currentUser : partner,
    }));

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const prevScrollTop = container?.scrollTop ?? 0;

    wasLoadingMore.current = true;
    setMessages((prev) => [...older, ...prev]);
    setHasMore(data.length === 50);
    setIsLoadingMore(false);

    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = prevScrollTop + (container.scrollHeight - prevScrollHeight);
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
