"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { SignupForm } from "./_components/SignupForm";
import {
  AgreeSection,
  type SignupAgreements,
} from "./_components/AgreeSection";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { AuthHero } from "../_components/AuthHero";

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
    <div className="flex min-h-screen bg-white">
      <AuthHero />
      <div className="flex w-full flex-col p-3 sm:px-6 lg:w-120 lg:shrink-0 lg:px-10 xl:w-140">
        <div className="flex items-center justify-end pt-3">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md px-5 sm:px-8">
            <div className="mb-7 flex flex-col items-center">
              <Image
                src="/kantoLogo.png"
                alt="Kanto"
                width={240}
                height={113}
                priority
                className="h-auto w-44 select-none sm:w-48"
              />
              <h1 className="mt-5 text-[24px] font-bold text-gray-950 sm:text-[26px]">
                {t("title")}
              </h1>
              <p className="mt-2 text-center text-sm leading-5 text-gray-500 break-keep">
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
      </div>
    </div>
  );
}
