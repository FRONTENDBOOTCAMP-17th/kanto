"use client";

import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function NoBankAccountModal({ onClose }: Props) {
  const router = useRouter();

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
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
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
