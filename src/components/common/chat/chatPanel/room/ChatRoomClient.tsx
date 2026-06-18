"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import type { Transaction } from "@/type/transaction";
import { markChatReadAction, sendMessageAction } from "./actions";
import { getChatBannerStateAction } from "./paymentActions";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import { useChatRoomRealtime } from "@/hooks/chat/useChatRoomRealtime";
import { useChatMessages } from "@/hooks/chat/useChatMessages";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import PaymentRequestModal from "./PaymentRequestModal";
import ReviewBanner from "./ReviewBanner";

interface Props {
  initialMessages: MessageWithSender[];
  currentUser: SellerInfo;
  chatId: number;
  postId: number;
  partner: SellerInfo;
  postTitle: string;
  sellerId: number | null;
  postPrice: number | null;
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
  sellerId,
  postPrice,
  onBack,
  onLeave
}: Props) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // 판매자이고 중고거래(가격 존재) 채팅이며, 진행 중/완료된 거래가 없을 때만 안전결제 요청 가능
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
      type: "text",
      transaction_id: null,
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

  // 결제요청 카드 메시지 추가 (판매자 본인 화면 — 리얼타임은 상대방 처리)
  const handlePaymentRequested = (message: MessageWithSender) => {
    setMessages((prev) => [...prev, message]);
  };

  // 거래 상태 변경을 해당 결제 카드에 즉시 반영 (리얼타임과 멱등)
  const handleTransactionChange = (transaction: Transaction) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.transaction_id === transaction.id ? { ...m, transaction } : m,
      ),
    );
  };

  useEffect(() => {
    markChatReadAction(chatId);
  }, [chatId]);

  // 후기 작성 배너 대상 거래 / 안전결제 요청 차단 여부 — 서버에서 권위 있게 조회(페이지네이션·realtime 무관)
  const [reviewableTxId, setReviewableTxId] = useState<number | null>(null);
  const refreshBannerState = useCallback(() => {
    getChatBannerStateAction(chatId)
      .then(({ reviewableTransactionId, paymentRequestBlocked }) => {
        setReviewableTxId(reviewableTransactionId);
        setPaymentRequestBlocked(paymentRequestBlocked);
      })
      .catch(() => {});
  }, [chatId]);

  // 마운트 + released 시스템 메시지 도착(양쪽 모두 수신) 시 재조회
  const systemMsgCount = messages.filter((m) => m.type === "system").length;
  useEffect(() => {
    refreshBannerState();
  }, [refreshBannerState, systemMsgCount]);

  return (
    <div className="relative flex flex-col h-full w-full bg-gray-50">
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
        onTransactionChange={handleTransactionChange}
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
      {showPaymentModal && postPrice !== null && (
        <PaymentRequestModal
          chatId={chatId}
          postId={postId}
          defaultAmount={postPrice}
          onClose={() => setShowPaymentModal(false)}
          onRequested={handlePaymentRequested}
        />
      )}
    </div>
  );
}
