"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SignupForm } from "./_components/SignupForm";
import {
  AgreeSection,
  type SignupAgreements,
} from "./_components/AgreeSection";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { AuthHero } from "../_components/AuthHero";
import { useSignup } from "./_hooks/useSignup";

const INITIAL_AGREEMENTS: SignupAgreements = {
  terms: false,
  privacy: false,
  age: false,
  marketing: false,
  push: false,
};

export default function SignupPage() {
  const [requiredChecked, setRequiredChecked] = useState(false);
  const [agreements, setAgreements] =
    useState<SignupAgreements>(INITIAL_AGREEMENTS);
  const t = useTranslations("Signup");
  const { isLoading, errorMessage, isSuccess, handleSignup, clearError } =
    useSignup(agreements);

  return (
    <div className="flex min-h-screen bg-white">
      <AuthHero />
      <div className="flex w-full flex-col p-3 sm:px-6 lg:w-120 lg:shrink-0 lg:px-10 xl:w-140">
        <div className="flex items-center justify-end pt-3">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md px-5 sm:px-8">
            <div className="mb-7">
              <h1 className="text-[24px] font-bold text-gray-950 sm:text-[26px]">
                {t("title")}
              </h1>
            </div>

            <SignupForm
              isLoading={isLoading}
              isSuccess={isSuccess}
              errorMessage={errorMessage}
              requiredChecked={requiredChecked}
              onSubmit={handleSignup}
              onClearError={clearError}
            >
              <AgreeSection
                onRequiredChange={setRequiredChecked}
                onAgreedChange={setAgreements}
              />
            </SignupForm>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm font-semibold text-teal-600 hover:text-teal-700"
              >
                {t("login")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
