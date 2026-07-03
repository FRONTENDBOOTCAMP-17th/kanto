"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { SignupForm } from "./_components/SignupForm";
import { AgreeSection } from "./_components/AgreeSection";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [requiredChecked, setRequiredChecked] = useState(false);
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
        options: { data: { name } },
      });

      if (error) {
        if (error.code === "user_already_exists") {
          setErrorMessage(t("emailExists"));
        } else {
          setErrorMessage(error.message);
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
      <div className="w-full max-w-[460px] bg-white rounded-[22px] border border-white/80 shadow-[0_18px_50px_rgba(15,118,110,0.16)] px-5 py-6 sm:px-8 sm:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal-700 transition-colors hover:text-teal-800"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          {t("home")}
        </Link>
        <div className="flex justify-center mt-5">
          <Image
            src="/kantoLogo.png"
            width={152}
            height={72}
            priority
            alt="Kanto"
            className="select-none"
          />
        </div>
        <div className="mb-7 mt-5 text-center">
          <h1 className="text-[24px] font-bold text-gray-950 sm:text-[26px]">{t("title")}</h1>
          <p className="mt-2 text-sm leading-5 text-gray-500">{t("description")}</p>
        </div>

        <SignupForm
          isLoading={isLoading}
          isSuccess={isSuccess}
          errorMessage={errorMessage}
          requiredChecked={requiredChecked}
          onSubmit={handleSignup}
          onClearError={() => setErrorMessage("")}
        >
          <AgreeSection onRequiredChange={setRequiredChecked} />
        </SignupForm>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t("haveAccount")}{" "}
            <Link href="/login" className="font-semibold text-teal-600 underline-offset-4 hover:text-teal-700 hover:underline">
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
