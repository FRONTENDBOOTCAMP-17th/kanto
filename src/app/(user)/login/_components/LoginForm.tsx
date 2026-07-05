"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    "h-auto rounded-xl border-gray-200 bg-white px-3.5 py-3 text-base text-gray-950 placeholder:text-gray-400 outline-none transition-colors focus-visible:border-teal-400 focus-visible:ring-3 focus-visible:ring-teal-100 sm:text-sm";
  const labelClass = "text-[13px] font-semibold text-gray-800";
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

      <div className="my-6 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-400">{t("or")}</span>
        <span className="h-px flex-1 bg-gray-200" />
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
          <Label htmlFor="email" className={labelClass}>
            {t("email")}
          </Label>
          <Input
            id="email"
            ref={emailInputRef}
            type="email"
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
            className={`${inputClass} ${fieldErrors.email ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}`}
          />
          {fieldErrors.email && (
            <p className="text-xs font-medium text-red-500">
              {t(`errors.${fieldErrors.email}`)}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className={labelClass}>
            {t("password")}
          </Label>
          <Input
            id="password"
            ref={passwordInputRef}
            type="password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            className={`${inputClass} ${fieldErrors.password ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100" : ""}`}
          />
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
          className="w-full active:scale-[1.05]"
        >
          {t("loginButton")}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t("noAccount")}{" "}
          <Link
            href="/signup"
            className="text-teal-500 hover:text-teal-600 font-semibold underline"
          >
            {t("signupCta")}
          </Link>
        </p>
      </div>

      <FindPasswordModal
        isOpen={isFindPasswordOpen}
        onClose={() => setIsFindPasswordOpen(false)}
      />
    </>
  );
}
