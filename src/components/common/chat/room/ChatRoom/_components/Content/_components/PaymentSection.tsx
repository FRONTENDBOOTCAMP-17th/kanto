"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import { useChatBannerState } from "../_hooks/useChatBannerState";
import ReviewBanner from "../../../../../features/review/ReviewBanner";
import PaymentRequestModal from "../../../../../features/payment/PaymentRequestModal";
import NoBankAccountModal from "../../../../../features/payment/NoBankAccountModal";

interface Props {
  activeChatId: number | null;
  postId: number;
  postPrice: number | null;
  sellerId: number | null;
  currentUser: SellerInfo;
  messages: MessageWithSender[];
  setMessages: Dispatch<SetStateAction<MessageWithSender[]>>;
}

/** 후기 배너, 안전결제 요청 버튼/모달, 계좌 미등록 안내를 조립한다. */
export default function PaymentSection({
  activeChatId,
  postId,
  postPrice,
  sellerId,
  currentUser,
  messages,
  setMessages,
}: Props) {
  const { user } = useAuthStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNoBankModal, setShowNoBankModal] = useState(false);

  const systemMsgCount = messages.filter((m) => m.type === "system").length;
  const { reviewableTxId, paymentRequestBlocked, refreshBannerState } =
    useChatBannerState(activeChatId, systemMsgCount);

  const canRequestPayment =
    sellerId !== null &&
    currentUser.id === sellerId &&
    postPrice !== null &&
    !paymentRequestBlocked;

  const handlePaymentRequested = (message: MessageWithSender) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <>
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
    </>
  );
}
