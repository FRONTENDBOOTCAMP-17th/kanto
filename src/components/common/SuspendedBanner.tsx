"use client";

import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function SuspendedBanner() {
  const { user } = useAuthStore();
  const suspendedUntil = user?.suspended_until;

  if (!suspendedUntil || new Date(suspendedUntil) <= new Date()) return null;

  const date = new Date(suspendedUntil);
  const isPermanent = date.getFullYear() >= 9999;
  const dateStr = date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full bg-red-600 text-white px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <p className="text-sm">
          <span className="font-semibold">계정이 정지되었습니다.</span>{" "}
          {isPermanent
            ? "영구 정지 처리된 계정입니다. 서비스 이용이 불가합니다."
            : `${dateStr}까지 서비스 이용이 제한됩니다.`}
        </p>
      </div>
    </div>
  );
}
