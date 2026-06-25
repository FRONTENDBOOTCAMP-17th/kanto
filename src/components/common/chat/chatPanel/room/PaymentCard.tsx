"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SellerInfo } from "@/type/user";
import type { Transaction } from "@/type/transaction";
import {
  startCheckoutAction,
  confirmReceiptAction,
  cancelTransactionAction,
} from "./paymentActions";

interface Props {
  transaction: Transaction;
  currentUser: SellerInfo;
  onTransactionChange: (transaction: Transaction) => void;
}

export default function PaymentCard({
  transaction,
  currentUser,
  onTransactionChange,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("Chat.payment");

  const isBuyer = currentUser.id === transaction.buyer_id;
  const isSeller = currentUser.id === transaction.seller_id;
  const amount = `₱${transaction.amount.toLocaleString()}`;

  const isTimedOut =
    transaction.status === "pending" &&
    Date.now() - new Date(transaction.created_at).getTime() > 24 * 60 * 60 * 1000;

  const run = async (fn: () => Promise<unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리에 실패했습니다.");
      setIsLoading(false);
    }
  };

  const handleCheckout = () =>
    run(async () => {
      const url = await startCheckoutAction(transaction.id);
      window.location.href = url;
    });

  const handleConfirm = () =>
    run(async () => {
      const updated = await confirmReceiptAction(transaction.id);
      onTransactionChange(updated);
      setIsLoading(false);
    });

  const handleCancel = () =>
    run(async () => {
      const updated = await cancelTransactionAction(transaction.id);
      onTransactionChange(updated);
      setIsLoading(false);
    });

  const primaryBtn =
    "w-full rounded-full bg-teal-500 py-2 text-xs font-medium text-white hover:bg-teal-600 transition-colors disabled:opacity-50 cursor-pointer";
  const ghostBtn =
    "w-full rounded-full border border-gray-200 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer";

  const renderBody = () => {
    if (isTimedOut) {
      return (
        <StatusLine
          icon={<Clock className="w-4 h-4 text-gray-400" />}
          text={t("expiredStatus")}
          muted
        />
      );
    }

    switch (transaction.status) {
      case "pending":
        return (
          <>
            <StatusLine
              icon={<ShieldCheck className="w-4 h-4 text-teal-500" />}
              text={t("requestTitle")}
            />
            {isBuyer && (
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className={primaryBtn}
              >
                {isLoading ? t("proceeding") : t("proceed")}
              </button>
            )}
            {isSeller && (
              <p className="text-center text-xs text-gray-400">
                {t("waitingBuyer")}
              </p>
            )}
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className={ghostBtn}
            >
              {t("cancelRequest")}
            </button>
          </>
        );
      case "paid":
        return (
          <>
            <StatusLine
              icon={<CheckCircle2 className="w-4 h-4 text-teal-500" />}
              text={t("escrow")}
            />
            {isBuyer ? (
              <>
                <p className="text-center text-xs text-gray-400">
                  {t("receiptGuide")}
                </p>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={primaryBtn}
                >
                  {isLoading ? t("proceeding") : t("confirmReceipt")}
                </button>
              </>
            ) : (
              <p className="text-center text-xs text-gray-400">
                {t("waitingReceipt")}
              </p>
            )}
          </>
        );
      case "released":
        return (
          <StatusLine
            icon={<CheckCircle2 className="w-4 h-4 text-teal-500" />}
            text={t("completed")}
          />
        );
      case "cancelled":
        return (
          <StatusLine
            icon={<XCircle className="w-4 h-4 text-gray-400" />}
            text={t("cancelledStatus")}
            muted
          />
        );
      case "expired":
        return (
          <StatusLine
            icon={<Clock className="w-4 h-4 text-gray-400" />}
            text={t("expiredStatus")}
            muted
          />
        );
    }
  };

  const isBlocked = isTimedOut || transaction.status === "expired" || transaction.status === "cancelled";

  return (
    <div className={`max-w-[75%] w-56 rounded-2xl border bg-white p-3 shadow-sm flex flex-col gap-2 ${isBlocked ? "border-gray-100 opacity-60 pointer-events-none" : "border-teal-100"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{t("safePayment")}</span>
        <span className="text-sm font-semibold text-gray-800">{amount}</span>
      </div>
      <hr className="border-gray-100" />
      {renderBody()}
      {error && <p className="text-center text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function StatusLine({
  icon,
  text,
  muted,
}: {
  icon: React.ReactNode;
  text: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-1.5 text-xs ${muted ? "text-gray-400" : "text-gray-700"}`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}
