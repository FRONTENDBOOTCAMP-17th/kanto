"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
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

  const isBuyer = currentUser.id === transaction.buyer_id;
  const isSeller = currentUser.id === transaction.seller_id;
  const amount = `₱${transaction.amount.toLocaleString()}`;

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

  // 상태별 헤더(아이콘/문구) + 액션
  const renderBody = () => {
    switch (transaction.status) {
      case "pending":
        return (
          <>
            <StatusLine
              icon={<ShieldCheck className="w-4 h-4 text-teal-500" />}
              text="안전결제 요청"
            />
            {isBuyer && (
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className={primaryBtn}
              >
                {isLoading ? "이동 중..." : "안전결제 진행하기"}
              </button>
            )}
            {isSeller && (
              <p className="text-center text-xs text-gray-400">
                구매자 결제 대기 중
              </p>
            )}
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className={ghostBtn}
            >
              요청 취소
            </button>
          </>
        );
      case "paid":
        return (
          <>
            <StatusLine
              icon={<CheckCircle2 className="w-4 h-4 text-teal-500" />}
              text="결제 완료 · 에스크로 보관중"
            />
            {isBuyer ? (
              <>
                <p className="text-center text-xs text-gray-400">
                  상품을 받으셨다면 수령 확인을 눌러주세요
                </p>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={primaryBtn}
                >
                  {isLoading ? "처리 중..." : "수령 확인"}
                </button>
              </>
            ) : (
              <p className="text-center text-xs text-gray-400">
                구매자 수령확인 대기 중
              </p>
            )}
          </>
        );
      case "released":
        return (
          <StatusLine
            icon={<CheckCircle2 className="w-4 h-4 text-teal-500" />}
            text="거래 완료"
          />
        );
      case "cancelled":
        return (
          <StatusLine
            icon={<XCircle className="w-4 h-4 text-gray-400" />}
            text="거래가 취소되었습니다"
            muted
          />
        );
      case "expired":
        return (
          <StatusLine
            icon={<Clock className="w-4 h-4 text-gray-400" />}
            text="결제 시간이 만료되었습니다"
            muted
          />
        );
    }
  };

  return (
    <div className="max-w-[75%] w-56 rounded-2xl border border-teal-100 bg-white p-3 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">안전결제</span>
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
