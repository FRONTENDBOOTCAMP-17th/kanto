"use client";

import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  const t = useTranslations("Common");
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    router.push("/login");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-80 rounded-sm bg-white px-8 py-10 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-lg font-bold tracking-tight text-gray-900">
          {t("loginRequired")}
        </p>

        <Button
          className="mt-6 w-full rounded-sm bg-teal-100 hover:bg-teal-200 text-teal-800 text-xs tracking-widest cursor-pointer hover:scale-105 active:scale-100 transition-all"
          onClick={handleLogin}
        >
          {t("goToLogin")}
        </Button>
      </div>
    </div>,
    document.body
  );
}
