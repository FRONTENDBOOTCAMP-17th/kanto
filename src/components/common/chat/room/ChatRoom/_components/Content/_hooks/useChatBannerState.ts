import { useCallback, useEffect, useState } from "react";
import { getChatBannerStateAction } from "../../../../../features/payment/paymentActions";

/** 후기 배너 노출 여부(reviewableTxId)와 안전결제 요청 가능 여부(paymentRequestBlocked)를 조회한다. */
export function useChatBannerState(chatId: number | null, systemMsgCount: number) {
  const [reviewableTxId, setReviewableTxId] = useState<number | null>(null);
  const [paymentRequestBlocked, setPaymentRequestBlocked] = useState(false);

  const refreshBannerState = useCallback(() => {
    if (chatId === null) return;
    getChatBannerStateAction(chatId)
      .then(({ reviewableTransactionId, paymentRequestBlocked }) => {
        setReviewableTxId(reviewableTransactionId);
        setPaymentRequestBlocked(paymentRequestBlocked);
      })
      .catch(() => {});
  }, [chatId]);

  useEffect(() => {
    refreshBannerState();
  }, [refreshBannerState, systemMsgCount]);

  return { reviewableTxId, paymentRequestBlocked, refreshBannerState };
}
