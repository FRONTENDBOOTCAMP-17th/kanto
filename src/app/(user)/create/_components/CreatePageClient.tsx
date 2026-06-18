"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShoppingBag, Briefcase, Home, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { IdentityVerificationModal } from "@/app/(user)/profile/_components/IdentityVerificationModal";

const CATEGORIES = [
  {
    key: "usedgoods",
    icon: ShoppingBag,
    href: "/usedgoods/create",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    key: "jobs",
    icon: Briefcase,
    href: "/job/create",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    key: "rental",
    icon: Home,
    href: "/rental/create",
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
  {
    key: "community",
    icon: Users,
    href: "/community/create",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
] as const;

interface CreatePageClientProps {
  initialIsVerified: boolean;
}

export function CreatePageClient({ initialIsVerified }: CreatePageClientProps) {
  const [isVerified, setIsVerified] = useState(initialIsVerified);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("Create");

  const handleCategoryClick = (href: string) => {
    if (isVerified) {
      router.push(href);
      return;
    }
    setPendingHref(href);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    setIsConfirmOpen(false);
    setIsVerificationOpen(true);
  };

  const handleConfirmCancel = () => {
    setIsConfirmOpen(false);
    setPendingHref(null);
  };

  const handleVerified = () => {
    setIsVerified(true);
    setIsVerificationOpen(false);
    if (pendingHref) {
      setIsSuccessOpen(true);
      window.setTimeout(() => {
        setIsSuccessOpen(false);
        router.push(pendingHref);
        setPendingHref(null);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-sm md:max-w-xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="page-title">{t("title")}</h1>
          <button
            type="button"
            onClick={() => setIsVerificationOpen(true)}
            disabled={isVerified}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:cursor-default border-teal-500 text-teal-500 hover:bg-teal-50 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <ShieldCheck className="w-4 h-4" />
            {isVerified ? "본인인증 완료" : "본인인증 하기"}
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-8">{t("subtitle")}</p>

        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map(({ key, icon: Icon, href, color, bg }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleCategoryClick(href)}
              className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-5 md:p-8 hover:border-teal-400 hover:shadow-sm transition-all text-left cursor-pointer"
            >
              <div
                className={`w-10 h-10 md:w-10 md:h-10 rounded-xl ${bg} flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 md:w-7 md:h-7 ${color}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm md:text-base">
                  {t(`categories.${key}.name`)}
                </p>
                <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                  {t(`categories.${key}.description`)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/45 px-4"
          onClick={handleConfirmCancel}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-teal-500" />
              <h2 className="text-base font-semibold text-gray-900">
                본인인증 필요
              </h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              본인인증을 해야 글 작성이 가능합니다.
              <br />
              본인인증 하시겠습니까?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
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
              본인인증 완료!
            </h2>
            <p className="text-sm text-gray-500">글쓰기 페이지로 이동합니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
