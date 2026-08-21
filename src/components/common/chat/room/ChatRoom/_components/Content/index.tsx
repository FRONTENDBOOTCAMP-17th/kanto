"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import type { MessageWithSender } from "@/type/chat/message";
import type { Transaction } from "@/type/transaction";
import { useChatStore } from "@/store/chatStore";
import type { ChatRoomData } from "../../_hooks/useChatRoomData";
import { useBlockState } from "./_hooks/useBlockState";
import { useChatBannerState } from "./_hooks/useChatBannerState";
import { useAutoDismissError } from "@/hooks/useAutoDismissError";
import { useReserveToggle } from "./_hooks/useReserveToggle";
import { useSendMessage } from "./_hooks/useSendMessage";
import { markChatReadAction } from "../../../actions";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import { useSpamConfig } from "@/hooks/useSpamConfig";
import { useChatRoomRealtime } from "./_hooks/useChatRoomRealtime";
import { useChatMessages } from "./_hooks/useChatMessages";
import ChatHeader from "../../../ChatHeader";
import MessageList from "../../../MessageList";
import ChatInput from "../../../ChatInput";
import PaymentRequestModal from "../../../../features/payment/PaymentRequestModal";
import NoBankAccountModal from "../../../../features/payment/NoBankAccountModal";
import ReviewBanner from "../../../../features/review/ReviewBanner";
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

  const { user } = useAuthStore();
  const [activeChatId, setActiveChatId] = useState<number | null>(chatIdProp);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNoBankModal, setShowNoBankModal] = useState(false);
  const [sendError, showSendError] = useAutoDismissError();

  const { isBlocked, iBlocked, refreshBlockState } = useBlockState(partner.id);

  const isSeller = sellerId !== null && currentUser.id === sellerId;

  const { isReserved, handleToggleReserve } = useReserveToggle({
    postId,
    activeChatId,
    initialIsReserved,
    onError: showSendError,
  });

  const spamConfig = useSpamConfig();
  const { isCooldown, cooldownSeconds, recordSend } = useSpamPrevention({
    windowMs: spamConfig.chat_window_sec * 1000,
    maxCount: spamConfig.chat_max_count,
    cooldownSec: spamConfig.chat_cooldown_sec,
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

  const { partnerOnline } = useChatRoomRealtime({
    chatId: activeChatId,
    currentUser,
    partner,
    setMessages,
  });

  const { input, setInput, handleSend } = useSendMessage({
    activeChatId,
    postId,
    partner,
    currentUser,
    setMessages,
    recordSend,
    onChatCreated: (newChatId) => {
      setActiveChatId(newChatId);
      useChatStore.getState().setSelectedChatId(newChatId);
      useChatStore.getState().setNewChatDraft(null);
    },
    onError: showSendError,
  });

  const handlePaymentRequested = (message: MessageWithSender) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleTransactionChange = (transaction: Transaction) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.transaction_id === transaction.id ? { ...m, transaction } : m,
      ),
    );
  };

  useEffect(() => {
    if (activeChatId === null) return;
    markChatReadAction(activeChatId);
  }, [activeChatId]);

  const systemMsgCount = messages.filter((m) => m.type === "system").length;
  const { reviewableTxId, paymentRequestBlocked, refreshBannerState } =
    useChatBannerState(activeChatId, systemMsgCount);

  const canRequestPayment =
    sellerId !== null &&
    currentUser.id === sellerId &&
    postPrice !== null &&
    !paymentRequestBlocked;

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
      <MessageList
        messages={messages}
        currentUser={currentUser}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        messagesEndRef={messagesEndRef}
        scrollContainerRef={scrollContainerRef}
        onTransactionChange={handleTransactionChange}
        partnerOnline={partnerOnline}
      />
      {reviewableTxId !== null && (
        <ReviewBanner
          key={reviewableTxId}
          transactionId={reviewableTxId}
          onReviewed={refreshBannerState}
        />
      )}
      {canRequestPayment && (
        <div className="bg-white border-t border-gray-100 px-4 py-2 md:px-3 shrink-0">
          <button
            onClick={() => {
                if (!user?.bank_code || !user?.bank_account_number) {
                  setShowNoBankModal(true);
                } else {
                  setShowPaymentModal(true);
                }
              }}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 py-2 text-sm md:text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            안전결제 요청하기
          </button>
        </div>
      )}
      <ChatInput
        input={input}
        onChange={setInput}
        onSend={handleSend}
        isCooldown={isCooldown}
        cooldownSeconds={cooldownSeconds}
        blocked={isBlocked}
      />
      {showNoBankModal && (
        <NoBankAccountModal onClose={() => setShowNoBankModal(false)} />
      )}
      {showPaymentModal && postPrice !== null && activeChatId !== null && (
        <PaymentRequestModal
          chatId={activeChatId}
          postId={postId}
          defaultAmount={postPrice}
          onClose={() => setShowPaymentModal(false)}
          onRequested={handlePaymentRequested}
        />
      )}
      <Toast message={sendError} showMessage={!!sendError} type="error" />
    </div>
  );
}
