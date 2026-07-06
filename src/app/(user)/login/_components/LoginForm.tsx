"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import LoginButton from "./LoginButton";
import { FindPasswordModal } from "./FindPasswordModal";

type LoginErrorKey =
  | "tooManyAttempts"
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "generic";
type FieldErrors = {
  email?: "emailInvalid";
  password?: "passwordInvalid";
};

export default function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const inputClass =
    "h-auto rounded-none border-0 border-b border-gray-200 bg-transparent py-3 pr-2 pl-8 text-base text-gray-950 placeholder:text-gray-400 outline-none transition-colors focus-visible:border-teal-400 focus-visible:ring-0 sm:text-sm";
  const iconClass =
    "pointer-events-none absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 text-gray-400";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<LoginErrorKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failedAttempts, setFailedAttempts] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFindPasswordOpen, setIsFindPasswordOpen] = useState(false);

  const handleSubmit = async () => {
    setErrorKey(null);
    setFieldErrors({});
    setFailedAttempts(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: "emailInvalid" });
      emailInputRef.current?.focus();
      return;
    }

    if (!password) {
      setFieldErrors({ password: "passwordInvalid" });
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setIsLoading(false);

    if (!res.ok) {
      const { code, failedAttempts } = await res.json();
      setFailedAttempts(
        typeof failedAttempts === "number" ? failedAttempts : null,
      );
      if (res.status === 429) {
        setErrorKey("tooManyAttempts");
      } else if (code === "invalid_credentials") {
        setFieldErrors({ password: "passwordInvalid" });
      } else if (code === "email_not_confirmed") {
        setErrorKey("emailNotConfirmed");
      } else {
        setErrorKey("generic");
      }
      setPassword("");
      return;
    }

    const { session } = await res.json();
    await supabase.auth.setSession(session);
    router.push("/");
  };

  const handleSocialLogin = async (
    provider: "kakao" | "google" | "facebook",
  ) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        ...(provider === "facebook" && {
          scopes: "email",
          queryParams: { auth_type: "rerequest" },
        }),
      },
    });

    if (error) {
      setErrorKey("generic");
      return;
    }
  };

  return (
    <>
      <div className="space-y-3">
        <LoginButton
          variant="kakao"
          onClick={() => handleSocialLogin("kakao")}
        />
        <LoginButton
          variant="google"
          onClick={() => handleSocialLogin("google")}
        />
        <LoginButton
          variant="facebook"
          onClick={() => handleSocialLogin("facebook")}
        />
      </div>

      <div className="my-8 flex justify-center" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <div className="relative">
            <Mail className={iconClass} strokeWidth={1.8} aria-hidden />
            <Input
              id="email"
              ref={emailInputRef}
              type="email"
              aria-label={t("email")}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    setFieldErrors({ email: "emailInvalid" });
                    return;
                  }
                  passwordInputRef.current?.focus();
                }
              }}
              className={`${inputClass} ${fieldErrors.email ? "border-red-400 focus-visible:border-red-400" : ""}`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs font-medium text-red-500">
              {t(`errors.${fieldErrors.email}`)}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="relative">
            <Lock className={iconClass} strokeWidth={1.8} aria-hidden />
            <Input
              id="password"
              ref={passwordInputRef}
              type="password"
              aria-label={t("password")}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={`${inputClass} ${fieldErrors.password ? "border-red-400 focus-visible:border-red-400" : ""}`}
            />
          </div>
          {fieldErrors.password && (
            <p className="text-xs font-medium text-red-500">
              {t(`errors.${fieldErrors.password}`)}
            </p>
          )}
        </div>
        {(errorKey || failedAttempts) && (
          <>
            {failedAttempts && (
              <p className="text-red-500 text-sm">
                <span className="block">
                  {t("errors.failedAttemptsCount", {
                    count: failedAttempts,
                  })}
                </span>
                <span className="block">
                  {t("errors.failedAttemptsLimit")}
                </span>
              </p>
            )}
            {errorKey && !failedAttempts && (
              <p className="text-red-500 text-sm">
                {t(`errors.${errorKey}`)}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="text-gray-500">{t("forgotPassword")}</span>
              <button
                type="button"
                onClick={() => setIsFindPasswordOpen(true)}
                className="shrink-0 whitespace-nowrap font-semibold text-teal-500 hover:text-teal-600"
              >
                {t("findPassword")}
              </button>
            </div>
          </>
        )}
        <Button
          variant="teal"
          type="submit"
          disabled={isLoading}
          className="h-auto w-full rounded-md border border-teal-200 bg-white py-3 text-base font-bold text-teal-500 hover:bg-teal-50 active:scale-[1.05] sm:text-sm"
        >
          {t("loginButton")}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/signup"
          className="block text-sm font-semibold text-teal-500 hover:text-teal-600"
        >
          {t("signup")}
        </Link>
        <Link
          href="/"
          className="mt-2 block text-sm text-gray-400 hover:text-gray-600"
        >
          {t("goHomeCta")}
        </Link>
      </div>

      <FindPasswordModal
        isOpen={isFindPasswordOpen}
        onClose={() => setIsFindPasswordOpen(false)}
      />
    </>
  );
}
