"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export function IdentityVerificationTrigger({
  isVerified,
  onVerify,
}: {
  isVerified: boolean;
  onVerify: () => void;
}) {
  const t = useTranslations("Profile.card");

  return (
    <div className="flex flex-col gap-3 px-5 md:px-0">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-500" />
        <h2 className="text-sm font-semibold text-gray-700">{t("verify")}</h2>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        {isVerified ? t("verifyComplete") : t("verifyDesc")}
      </p>
      <button
        type="button"
        onClick={onVerify}
        disabled={isVerified}
        className="cursor-pointer w-full py-2.5 rounded-lg border border-teal-500 text-teal-500 text-sm font-medium bg-transparent hover:bg-teal-50 transition-colors disabled:cursor-default disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
      >
        {isVerified ? "인증 완료" : "본인인증 하기"}
      </button>
    </div>
  );
}
