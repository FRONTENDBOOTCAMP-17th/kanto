"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { SignupForm } from "./_components/SignupForm";
import {
  AgreeSection,
  type SignupAgreements,
} from "./_components/AgreeSection";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

const INITIAL_AGREEMENTS: SignupAgreements = {
  terms: false,
  privacy: false,
  age: false,
  marketing: false,
  push: false,
};

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [requiredChecked, setRequiredChecked] = useState(false);
  const [agreements, setAgreements] =
    useState<SignupAgreements>(INITIAL_AGREEMENTS);
  const t = useTranslations("Signup");

  const handleSignup = async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            terms_agreed: agreements.terms,
            privacy_agreed: agreements.privacy,
            age_confirmed: agreements.age,
            marketing_consent: agreements.marketing,
            push_consent: agreements.push,
            agreements_updated_at: new Date().toISOString(),
          },
        },
      });

      if (error) {
        if (error.code === "user_already_exists") {
          setErrorMessage(t("emailExists"));
        } else {
          setErrorMessage(t("signupFailed"));
        }
        return;
      }

      if (data.user?.identities?.length === 0) {
        setErrorMessage(t("emailExists"));
        return;
      }

      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-cyan-50 to-emerald-100 flex items-center justify-center px-3 py-5 sm:px-6 sm:py-10">
      <div className="w-full max-w-115 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal-700 transition-colors hover:text-teal-800"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            {t("home")}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="flex justify-center mt-5">
          <Image
            src="/kantoLogo.png"
            width={152}
            height={72}
            priority
            alt="Kanto"
            className="select-none -translate-x-0.5"
          />
        </div>
        <div className="mb-7 mt-5 text-center">
          <h1 className="text-[24px] font-bold text-gray-950 sm:text-[26px]">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-5 text-gray-500 break-keep">
            {t("description")}
          </p>
        </div>

        <SignupForm
          isLoading={isLoading}
          isSuccess={isSuccess}
          errorMessage={errorMessage}
          requiredChecked={requiredChecked}
          onSubmit={handleSignup}
          onClearError={() => setErrorMessage("")}
        >
          <AgreeSection
            onRequiredChange={setRequiredChecked}
            onAgreedChange={setAgreements}
          />
        </SignupForm>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t("haveAccount")}{" "}
            <Link
              href="/login"
              className="font-semibold text-teal-600 underline-offset-4 hover:text-teal-700 hover:underline"
            >
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
