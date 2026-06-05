"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    router.push("/login");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-80 rounded-2xl bg-white px-8 py-10 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-center text-base font-medium text-gray-700">
          로그인 이후 이용 가능합니다
        </p>

        <Button
          className="mt-6 w-full bg-teal-500 hover:bg-teal-600 text-white"
          onClick={handleLogin}
        >
          로그인 하러 가기
        </Button>
      </div>
    </div>
  );
}
