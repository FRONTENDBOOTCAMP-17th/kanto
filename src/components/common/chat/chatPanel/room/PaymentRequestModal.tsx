"use client";

import { useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MessageWithSender } from "@/type/chat/message";
import { createPaymentRequestAction } from "./paymentActions";

interface Props {
  chatId: number;
  postId: number;
  defaultAmount: number;
  onClose: () => void;
  onRequested: (message: MessageWithSender) => void;
}

export default function PaymentRequestModal({
  chatId,
  postId,
  defaultAmount,
  onClose,
  onRequested,
}: Props) {
  const t = useTranslations("Chat.payment");
  const [amount, setAmount] = useState(String(defaultAmount));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError(t("invalidAmount"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const message = await createPaymentRequestAction({
        chatId,
        postId,
        amount: value,
      });
      onRequested(message);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("requestFailed"));
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-base font-semibold text-gray-800">
            <ShieldCheck className="w-5 h-5 text-teal-500" />
            {t("requestTitle")}
          </h3>
          <button onClick={onClose} aria-label={t("close")} className="cursor-pointer text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label htmlFor="payment-amount" className="text-sm text-gray-500">
          {t("requestAmountLabel")}
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-teal-400">
          <span className="text-gray-500">₱</span>
          <input
            id="payment-amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full outline-none text-base md:text-sm"
          />
        </div>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-4 w-full rounded-full bg-teal-500 py-2.5 text-sm font-medium text-white hover:bg-teal-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? t("requesting") : t("requestSubmit")}
        </button>
      </div>
    </div>
  );
}
