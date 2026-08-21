import { useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { getRoomMessages } from "@/services/go/groupChat";
import { useGroupChatRealtime } from "@/hooks/go/useGroupChatRealtime";
import type { GroupMessageWithSender } from "@/type/groupChat";
import type { SellerInfo } from "@/type/user";

interface Params {
  roomId: number;
  currentUser: SellerInfo;
  blockedIds: Set<number>;
  initialMessages: GroupMessageWithSender[];
  initialHasMore: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  wasNearBottomRef: RefObject<boolean>;
  onLoadMoreError: () => void;
  onRealtimeInsert: () => void;
}

/** 그룹 메시지 목록·이전 메시지 페이지네이션·실시간 수신·차단멤버 필터링을 관리한다. */
export function useGroupMessages({
  roomId,
  currentUser,
  blockedIds,
  initialMessages,
  initialHasMore,
  scrollContainerRef,
  wasNearBottomRef,
  onLoadMoreError,
  onRealtimeInsert,
}: Params) {
  const [messages, setMessages] = useState<GroupMessageWithSender[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useGroupChatRealtime({
    roomId,
    currentUser,
    blockedIds,
    setMessages,
    onMessageInserted: onRealtimeInsert,
  });

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || messages.length === 0) return;
    const scrollEl = scrollContainerRef.current;
    const prevScrollHeight = scrollEl?.scrollHeight ?? 0;
    const prevScrollTop = scrollEl?.scrollTop ?? 0;
    setIsLoadingMore(true);
    try {
      const oldest = messages[0].created_at;
      const older = await getRoomMessages(roomId, oldest);
      wasNearBottomRef.current = false;
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === 50);
      window.requestAnimationFrame(() => {
        if (!scrollEl) return;
        scrollEl.scrollTop =
          prevScrollTop + (scrollEl.scrollHeight - prevScrollHeight);
      });
    } catch {
      onLoadMoreError();
    } finally {
      setIsLoadingMore(false);
    }
  };

  const visibleMessages = messages.filter(
    (m) => m.type === "system" || !blockedIds.has(m.sender_id),
  );

  return {
    messages,
    setMessages: setMessages as Dispatch<SetStateAction<GroupMessageWithSender[]>>,
    visibleMessages,
    hasMore,
    isLoadingMore,
    handleLoadMore,
  };
}
