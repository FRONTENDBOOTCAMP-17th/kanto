"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSpamConfig } from "@/hooks/useSpamConfig";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import { useAutoDismissError } from "@/hooks/useAutoDismissError";
import { useRoomRead } from "./_hooks/useRoomRead";
import { useGroupMessages } from "./_hooks/useGroupMessages";
import { useGroupScrollAnchor } from "./_hooks/useGroupScrollAnchor";
import { useGroupSendMessage } from "./_hooks/useGroupSendMessage";
import GroupMessageList from "../../../GroupMessageList";
import GroupChatInput from "../../../GroupChatInput";
import { GoToast } from "@/components/go/GoToast";
import type { GroupMessageWithSender } from "@/type/groupChat";
import type { SellerInfo } from "@/type/user";

interface Props {
  roomId: number;
  currentUser: SellerInfo;
  blockedIds: Set<number>;
  initialMessages: GroupMessageWithSender[];
  initialHasMore: boolean;
  initialUnreadMessageId: number | null;
}

export default function Content({
  roomId,
  currentUser,
  blockedIds,
  initialMessages,
  initialHasMore,
  initialUnreadMessageId,
}: Props) {
  const t = useTranslations("Go.chat");
  const [sendError, showSendError] = useAutoDismissError();
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);

  const { markCurrentRoomRead } = useRoomRead(roomId);

  const handleRealtimeInsert = () => {
    if (wasNearBottomRef.current) {
      markCurrentRoomRead();
    } else {
      setShowJumpToLatest(true);
    }
  };

  const spamConfig = useSpamConfig();
  const { isCooldown, cooldownSeconds, recordSend } = useSpamPrevention({
    windowMs: spamConfig.chat_window_sec * 1000,
    maxCount: spamConfig.chat_max_count,
    cooldownSec: spamConfig.chat_cooldown_sec,
  });

  const {
    messages,
    setMessages,
    visibleMessages,
    hasMore,
    isLoadingMore,
    handleLoadMore,
  } = useGroupMessages({
    roomId,
    currentUser,
    blockedIds,
    initialMessages,
    initialHasMore,
    scrollContainerRef,
    wasNearBottomRef,
    onLoadMoreError: () => showSendError(t("sendFailed")),
    onRealtimeInsert: handleRealtimeInsert,
  });

  const { jumpToLatest, notifyMessageSent, handleNearBottomChange } = useGroupScrollAnchor({
    roomId,
    messagesLength: messages.length,
    initialUnreadMessageId,
    markCurrentRoomRead,
    messagesEndRef,
    scrollContainerRef,
    wasNearBottomRef,
    setShowJumpToLatest,
  });

  const { input, setInput, handleSend } = useGroupSendMessage({
    roomId,
    currentUser,
    setMessages,
    recordSend,
    onSent: notifyMessageSent,
    onError: () => showSendError(t("sendFailed")),
  });

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <GroupMessageList
        messages={visibleMessages}
        currentUser={currentUser}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
        onNearBottomChange={handleNearBottomChange}
        messagesEndRef={messagesEndRef}
        scrollContainerRef={scrollContainerRef}
      />
      {showJumpToLatest && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-16.5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-md hover:bg-teal-100"
        >
          {t("jumpToLatest")}
        </button>
      )}
      <GroupChatInput
        input={input}
        onChange={setInput}
        onSend={handleSend}
        isCooldown={isCooldown}
        cooldownSeconds={cooldownSeconds}
      />
      {sendError && <GoToast message={sendError} />}
    </div>
  );
}
