"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signUpUser } from "../_lib/signUpUser";
import type { SignupAgreements } from "../_components/AgreeSection";

interface SignupValues {
  name: string;
  email: string;
  password: string;
}

export function useSignup(agreements: SignupAgreements) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const t = useTranslations("Signup");

  const handleSignup = async ({ name, email, password }: SignupValues) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await signUpUser({ name, email, password, agreements });

      if (result.status === "error") {
        setErrorMessage(
          result.code === "email_exists" ? t("emailExists") : t("signupFailed"),
        );
        return;
      }

      setIsSuccess(true);
      router.replace("/main");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    errorMessage,
    isSuccess,
    handleSignup,
    clearError: () => setErrorMessage(""),
  };
}
