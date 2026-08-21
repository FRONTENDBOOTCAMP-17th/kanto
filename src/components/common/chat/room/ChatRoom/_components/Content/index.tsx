"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import type { ChatRoomData } from "../../_hooks/useChatRoomData";
import { useBlockState } from "./_hooks/useBlockState";
import { useAutoDismissError } from "@/hooks/useAutoDismissError";
import { useReserveToggle } from "./_hooks/useReserveToggle";
import { useChatMessages } from "./_hooks/useChatMessages";
import { markChatReadAction } from "../../../actions";
import ChatHeader from "../../../ChatHeader";
import MessagingSection from "./_components/MessagingSection";
import PaymentSection from "./_components/PaymentSection";
import Toast from "@/components/common/Toast";

interface Props {
  data: ChatRoomData;
}

export default function ChatRoomBody({ data }: Props) {
  const {
    messages: initialMessages,
    currentUser,
    chatId: chatIdProp,
    postId,
    partner,
    postTitle,
    postType,
    sellerId,
    postPrice,
    isReserved: initialIsReserved,
    isSold,
  } = data;

  const [activeChatId, setActiveChatId] = useState<number | null>(chatIdProp);
  const [sendError, showSendError] = useAutoDismissError();

  const { isBlocked, iBlocked, refreshBlockState } = useBlockState(partner.id);

  const isSeller = sellerId !== null && currentUser.id === sellerId;

  const { isReserved, handleToggleReserve } = useReserveToggle({
    postId,
    activeChatId,
    initialIsReserved,
    onError: showSendError,
  });

  const {
    messages,
    setMessages,
    hasMore,
    isLoadingMore,
    loadMore,
    messagesEndRef,
    scrollContainerRef,
  } = useChatMessages({ initialMessages, currentUser, chatId: activeChatId, partner });

  useEffect(() => {
    if (activeChatId === null) return;
    markChatReadAction(activeChatId);
  }, [activeChatId]);

  const handleBack = () => {
    if (activeChatId !== null) {
      useChatStore.getState().setChatList((prev) =>
        prev.map((c) => {
          if (c.id !== activeChatId) return c;
          return {
            ...c,
            user_id_1_unread: c.user_id_1 === currentUser.id ? 0 : c.user_id_1_unread,
            user_id_2_unread: c.user_id_2 === currentUser.id ? 0 : c.user_id_2_unread,
          };
        }),
      );
    }
    useChatStore.getState().setNewChatDraft(null);
    useChatStore.getState().setView("list");
  };

  const handleLeaveNotify = () => {
    useChatStore.getState().setChatList((prev) => prev.filter((c) => c.id !== activeChatId));
    useChatStore.getState().setNewChatDraft(null);
    useChatStore.getState().setView("list");
  };

  const isCompleted =
    isSold || messages.some((m) => m.transaction?.status === "released");

  return (
    <div className="relative flex flex-col h-full w-full bg-gray-50">
      <ChatHeader
        partner={partner}
        postTitle={postTitle}
        chatId={activeChatId ?? 0}
        currentUserId={currentUser.id}
        onBack={handleBack}
        onLeave={handleLeaveNotify}
        iBlocked={iBlocked}
        onBlockChange={refreshBlockState}
        isReserved={postType === "used_goods" && isSeller && !isCompleted ? isReserved : undefined}
        onToggleReserve={postType === "used_goods" && isSeller && !isCompleted ? handleToggleReserve : undefined}
      />
      <MessagingSection
        activeChatId={activeChatId}
        postId={postId}
        partner={partner}
        currentUser={currentUser}
        messages={messages}
        setMessages={setMessages}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        loadMore={loadMore}
        messagesEndRef={messagesEndRef}
        scrollContainerRef={scrollContainerRef}
        blocked={isBlocked}
        onChatCreated={(newChatId) => {
          setActiveChatId(newChatId);
          useChatStore.getState().setSelectedChatId(newChatId);
          useChatStore.getState().setNewChatDraft(null);
        }}
        onError={showSendError}
      >
        <PaymentSection
          activeChatId={activeChatId}
          postId={postId}
          postPrice={postPrice}
          sellerId={sellerId}
          currentUser={currentUser}
          messages={messages}
          setMessages={setMessages}
        />
      </MessagingSection>
      <Toast message={sendError} showMessage={!!sendError} type="error" />
    </div>
  );
}
