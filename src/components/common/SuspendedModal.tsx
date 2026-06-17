"use client";

import { X, ShieldAlert } from "lucide-react";
import { useSuspended, useSuspendedModalStore } from "@/hooks/useSuspended";

export function SuspendedModal() {
  const { isOpen, close } = useSuspendedModalStore();
  const { suspendedUntil } = useSuspended();

  if (!isOpen) return null;

  const date = suspendedUntil ? new Date(suspendedUntil) : null;
  const isPermanent = date ? date.getFullYear() >= 9999 : false;
  const dateStr = date
    ? date.toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={close}
    >
      <div
        className="relative w-80 rounded-2xl bg-white px-8 py-10 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <ShieldAlert className="w-10 h-10 text-red-500" />
          <p className="text-base font-semibold text-gray-800">계정이 정지되었습니다</p>
          <p className="text-sm text-gray-500">
            {isPermanent
              ? "영구 정지 처리된 계정입니다."
              : `${dateStr}까지 서비스 이용이 제한됩니다.`}
          </p>
        </div>
      </div>
    </div>
  );
}
