"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { SignupForm } from "./_components/SignupForm";
import { AgreeSection } from "./_components/AgreeSection";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [requiredChecked, setRequiredChecked] = useState(false);

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
        setErrorMessage(error.message);
        return;
      }

      if (data.user?.identities?.length === 0) {
        setErrorMessage("이미 가입된 이메일입니다.");
        return;
      }

      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-w-97.5 bg-linear-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-97.5 bg-white rounded-2xl shadow-md p-8 my-8">
        <Link href="/" className="text-sm text-teal-600 font-semibold">
          홈으로 가기
        </Link>
        <div className="flex justify-center mb-8 mt-4">
          <Image
            src="/kantoLogo.png"
            width={200}
            height={94}
            priority
            alt="Kanto"
            className="select-none"
          />
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
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-teal-500 hover:text-teal-600 font-semibold">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
