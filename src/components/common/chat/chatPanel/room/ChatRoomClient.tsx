"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import type { Transaction } from "@/type/transaction";
import { checkBlockedAction, checkUserSuspendedAction, createChatAndSendAction, markChatReadAction, sendMessageAction } from "./actions";
import { getChatBannerStateAction } from "./paymentActions";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import { useChatRoomRealtime } from "@/hooks/chat/useChatRoomRealtime";
import { useChatMessages } from "@/hooks/chat/useChatMessages";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import PaymentRequestModal from "./PaymentRequestModal";
import { toggleReserveAction } from "./toggleReserveAction";
import ReviewBanner from "./ReviewBanner";
import Toast from "@/components/common/Toast";

interface Props {
  initialMessages: MessageWithSender[];
  currentUser: SellerInfo;
  chatId: number | null;
  postId: number;
  partner: SellerInfo;
  postTitle: string;
  postType: string;
  sellerId: number | null;
  postPrice: number | null;
  isReserved: boolean;
  onBack?: () => void;
  onLeave?: () => void;
  onChatCreated?: (chatId: number) => void;
}

export default function ChatRoomClient({
  initialMessages,
  currentUser,
  chatId: chatIdProp,
  postId,
  partner,
  postTitle,
  postType,
  sellerId,
  postPrice,
  isReserved: initialIsReserved,
  onBack,
  onLeave,
  onChatCreated,
}: Props) {
  const router = useRouter();
  const [activeChatId, setActiveChatId] = useState<number | null>(chatIdProp);
  const [input, setInput] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isReserved, setIsReserved] = useState(initialIsReserved);
  const [sendError, setSendError] = useState("");

  const isSeller = sellerId !== null && currentUser.id === sellerId;

  const handleToggleReserve = async () => {
    const next = !isReserved;
    setIsReserved(next);
    await toggleReserveAction(postId, next);
  };

  const [paymentRequestBlocked, setPaymentRequestBlocked] = useState(false);
  const canRequestPayment =
    sellerId !== null &&
    currentUser.id === sellerId &&
    postPrice !== null &&
    !paymentRequestBlocked;

  const { isCooldown, cooldownSeconds, recordSend } = useSpamPrevention();
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

  const handleSend = async () => {
    if (!input.trim()) return;

    if (recordSend()) {
      setInput("");
      return;
    }

    const content = input.trim();
    setInput("");

    if (await checkUserSuspendedAction(partner.id)) {
      setSendError("정지된 사용자입니다.");
      setTimeout(() => setSendError(""), 3000);
      return;
    }

    if (await checkBlockedAction(partner.id)) {
      setSendError("차단된 사용자와는 메시지를 주고받을 수 없습니다.");
      setTimeout(() => setSendError(""), 3000);
      return;
    }

    const tempId = Date.now();
    const optimistic: MessageWithSender = {
      id: tempId,
      created_at: new Date().toISOString(),
      chat_id: activeChatId ?? 0,
      sender_id: currentUser.id,
      post_id: postId,
      content,
      is_read: false,
      type: "text",
      transaction_id: null,
      sender: currentUser,
      tempId,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      if (activeChatId === null) {
        const { chatId: newChatId, message: saved } = await createChatAndSendAction({
          partnerUserId: partner.id,
          postId,
          content,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId
              ? { ...m, id: saved.id, chat_id: newChatId, tempId: undefined }
              : m,
          ),
        );
        setActiveChatId(newChatId);
        onChatCreated?.(newChatId);
      } else {
        const saved = await sendMessageAction({ chatId: activeChatId, postId, content });
        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId ? { ...m, id: saved.id, tempId: undefined } : m,
          ),
        );
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      setSendError(e instanceof Error ? e.message : "메시지를 보낼 수 없습니다.");
      setTimeout(() => setSendError(""), 3000);
    }
  };

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
    return () => {
      markChatReadAction(activeChatId);
    };
  }, [activeChatId]);

  const [reviewableTxId, setReviewableTxId] = useState<number | null>(null);
  const refreshBannerState = useCallback(() => {
    if (activeChatId === null) return;
    getChatBannerStateAction(activeChatId)
      .then(({ reviewableTransactionId, paymentRequestBlocked }) => {
        setReviewableTxId(reviewableTransactionId);
        setPaymentRequestBlocked(paymentRequestBlocked);
      })
      .catch(() => {});
  }, [activeChatId]);

  const systemMsgCount = messages.filter((m) => m.type === "system").length;
  useEffect(() => {
    refreshBannerState();
  }, [refreshBannerState, systemMsgCount]);

  return (
    <div className="relative flex flex-col h-full w-full bg-gray-50">
      <ChatHeader
        partner={partner}
        postTitle={postTitle}
        chatId={activeChatId ?? 0}
        currentUserId={currentUser.id}
        onBack={onBack ?? (() => router.back())}
        onLeave={onLeave}
        isReserved={postType === "used_goods" && isSeller ? isReserved : undefined}
        onToggleReserve={postType === "used_goods" && isSeller ? handleToggleReserve : undefined}
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
            onClick={() => setShowPaymentModal(true)}
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
      />
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
