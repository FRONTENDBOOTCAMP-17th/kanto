"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SquarePen, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { IdentityVerificationModal } from "@/app/(user)/profile/_components/IdentityVerificationModal";

interface CategoryWriteButtonProps {
  href: string; // 글쓰기 폼 경로 (예: /usedgoods/create)
  label: string;
  isLoggedIn: boolean;
  initialIsVerified: boolean;
}

export function CategoryWriteButton({
  href,
  label,
  isLoggedIn,
  initialIsVerified,
}: CategoryWriteButtonProps) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(initialIsVerified);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const handleClick = () => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    // 이미 인증된 사용자: 안내 모달 1.5초 후 글쓰기 폼으로 이동
    if (isVerified) {
      setIsSuccessOpen(true);
      window.setTimeout(() => {
        setIsSuccessOpen(false);
        router.push(href);
      }, 1500);
      return;
    }
    // 미인증 사용자: 본인인증 관문을 연다.
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    setIsConfirmOpen(false);
    setIsVerificationOpen(true);
  };

  const handleVerified = () => {
    setIsVerified(true);
    setIsVerificationOpen(false);
    // 서버 데이터를 다시 읽어 캐시를 갱신한다. (뒤로가기 시 미인증으로 보이는 문제 방지)
    router.refresh();
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        className="cursor-pointer gap-1.5 rounded-xl border-teal-500 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
        onClick={handleClick}
      >
        <SquarePen className="w-4 h-4" />
        {label}
      </Button>

      <LoginRequiredModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/45 px-4"
          onClick={() => setIsConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-teal-500" />
              <h2 className="text-base font-semibold text-gray-900">본인인증 필요</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              본인인증을 해야 글 작성이 가능합니다.
              <br />
              본인인증 하시겠습니까?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="h-10 rounded-lg bg-teal-500 text-sm font-medium text-white hover:bg-teal-600 transition-colors cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {isVerificationOpen && (
        <IdentityVerificationModal
          isOpen={isVerificationOpen}
          defaultName=""
          defaultEmail=""
          onClose={() => setIsVerificationOpen(false)}
          onVerified={handleVerified}
        />
      )}

      {isSuccessOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl text-center">
            <ShieldCheck className="w-10 h-10 text-teal-500 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              본인인증이 완료된 사용자입니다.
            </h2>
            <p className="text-sm text-gray-500">글쓰기 페이지로 이동합니다.</p>
          </div>
        </div>
      )}
    </>
  );
}
