"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CreditCard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import type { Transaction } from "@/type/transaction";
import { createChatAndSendAction, getBlockStateAction, markChatReadAction, sendMessageAction } from "./actions";
import { getChatBannerStateAction } from "./paymentActions";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import { useSpamConfig } from "@/hooks/useSpamConfig";
import { useChatRoomRealtime } from "@/hooks/chat/useChatRoomRealtime";
import { useChatMessages } from "@/hooks/chat/useChatMessages";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import PaymentRequestModal from "./PaymentRequestModal";
import { toggleReserveAction, sendReserveSystemMessageAction } from "./toggleReserveAction";
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
  isSold: boolean;
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
  isSold,
  onBack,
  onLeave,
  onChatCreated,
}: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeChatId, setActiveChatId] = useState<number | null>(chatIdProp);
  const [input, setInput] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNoBankModal, setShowNoBankModal] = useState(false);
  const [isReserved, setIsReserved] = useState(initialIsReserved);
  const [sendError, setSendError] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [iBlocked, setIBlocked] = useState(false);

  const refreshBlockState = useCallback(() => {
    getBlockStateAction(partner.id)
      .then(({ blocked, iBlocked }) => {
        setIsBlocked(blocked);
        setIBlocked(iBlocked);
      })
      .catch(() => {});
  }, [partner.id]);

  useEffect(() => {
    refreshBlockState();
  }, [refreshBlockState]);

  const isSeller = sellerId !== null && currentUser.id === sellerId;

  const handleToggleReserve = async () => {
    const next = !isReserved;
    setIsReserved(next);
    try {
      await toggleReserveAction(postId, next);
      
      router.refresh();
    } catch {
      setIsReserved(!next);
      setSendError("예약 상태 변경에 실패했습니다.");
      setTimeout(() => setSendError(""), 3000);
      return;
    }
    if (activeChatId !== null) {
      try {
        await sendReserveSystemMessageAction(postId, next, activeChatId);
      } catch {
        setSendError("채팅 알림 전송에 실패했습니다.");
        setTimeout(() => setSendError(""), 3000);
      }
    }
  };

  const [paymentRequestBlocked, setPaymentRequestBlocked] = useState(false);
  const canRequestPayment =
    sellerId !== null &&
    currentUser.id === sellerId &&
    postPrice !== null &&
    !paymentRequestBlocked;

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

  
  
  
  const isCompleted =
    isSold || messages.some((m) => m.transaction?.status === "released");

  return (
    <div className="relative flex flex-col h-full w-full bg-gray-50">
      <ChatHeader
        partner={partner}
        postTitle={postTitle}
        chatId={activeChatId ?? 0}
        currentUserId={currentUser.id}
        onBack={onBack ?? (() => router.back())}
        onLeave={onLeave}
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
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowNoBankModal(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
              <CreditCard className="h-6 w-6 text-teal-500" />
            </div>
            <p className="text-center text-base font-semibold text-gray-800">
              정산 계좌를 먼저 등록해주세요
            </p>
            <button
              onClick={() => router.push("/profile")}
              className="w-full rounded-full bg-teal-500 py-2.5 text-sm font-medium text-white hover:bg-teal-600 transition-colors cursor-pointer"
            >
              계좌 등록하러 가기
            </button>
            <button
              onClick={() => setShowNoBankModal(false)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              닫기
            </button>
          </div>
        </div>
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
