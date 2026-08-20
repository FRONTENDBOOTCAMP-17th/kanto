"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CreditCard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import type { Transaction } from "@/type/transaction";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatStore, type PendingNewChat } from "@/store/chatStore";
import { useChatRoomData, type ChatRoomData } from "./_hooks/useChatRoomData";
import { createChatAndSendAction, markChatReadAction, sendMessageAction } from "./actions";
import { getBlockStateAction } from "../features/block/blockActions";
import { getChatBannerStateAction } from "../features/payment/paymentActions";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import { useSpamConfig } from "@/hooks/useSpamConfig";
import { useChatRoomRealtime } from "./_hooks/useChatRoomRealtime";
import { useChatMessages } from "./_hooks/useChatMessages";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import PaymentRequestModal from "../features/payment/PaymentRequestModal";
import { toggleReserveAction, sendReserveSystemMessageAction } from "../features/reserve/toggleReserveAction";
import ReviewBanner from "../features/review/ReviewBanner";
import Toast from "@/components/common/Toast";

interface ChatRoomProps {
  chatId: number | null;
  newChatMeta?: PendingNewChat;
  currentUserOverride?: SellerInfo;
}

export default function ChatRoom({
  chatId,
  newChatMeta,
  currentUserOverride,
}: ChatRoomProps) {
  const data = useChatRoomData(chatId, newChatMeta, currentUserOverride);

  if (!data)
    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-32 h-4" />
        </div>
        <div className="flex-1 flex flex-col gap-3 px-4 py-4 overflow-hidden">
          <Skeleton className="w-2/5 h-9 rounded-2xl self-start" />
          <Skeleton className="w-1/2 h-9 rounded-2xl self-end" />
          <Skeleton className="w-1/3 h-9 rounded-2xl self-start" />
          <Skeleton className="w-2/5 h-9 rounded-2xl self-end" />
          <Skeleton className="w-1/4 h-9 rounded-2xl self-start" />
        </div>
        <div className="px-4 py-3 border-t border-gray-200 bg-white shrink-0">
          <Skeleton className="w-full h-10 rounded-full" />
        </div>
      </div>
    );

  return (
    <ChatRoomBody
      key={data.chatId ?? `new-${data.postId}-${data.partner.id}`}
      data={data}
    />
  );
}

interface ChatRoomBodyProps {
  data: ChatRoomData;
}

function ChatRoomBody({ data }: ChatRoomBodyProps) {
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
        useChatStore.getState().setSelectedChatId(newChatId);
        useChatStore.getState().setNewChatDraft(null);
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
              onClick={() => router.push("/profile?tab=payment")}
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
