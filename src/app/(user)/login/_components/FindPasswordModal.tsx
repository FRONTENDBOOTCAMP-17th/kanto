"use client";

import { lockScroll, unlockScroll } from "@/utils/lockScroll";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Mail, Timer, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_SECONDS = 180;

type Stage = "request" | "verify" | "reset";
type TouchedFields = {
  name?: boolean;
  email?: boolean;
  code?: boolean;
  newPassword?: boolean;
  confirmPassword?: boolean;
};

const API_ERROR_CODES = new Set([
  "missing_fields",
  "account_not_found",
  "name_not_found",
  "email_not_found",
  "email_send_failed",
  "email_not_configured",
  "code_expired",
  "code_mismatch",
  "code_invalid_or_expired",
  "invalid_password",
  "update_failed",
]);

interface FindPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return `${minutes}:${String(restSeconds).padStart(2, "0")}`;
}

export function FindPasswordModal({ isOpen, onClose }: FindPasswordModalProps) {
  const t = useTranslations("FindPassword");
  const locale = useLocale();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const newPasswordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("request");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [devCode, setDevCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [touched, setTouched] = useState<TouchedFields>({});
  const [serverFieldError, setServerFieldError] = useState<
    "name" | "email" | null
  >(null);

  useEffect(() => {
    if (!isOpen || stage !== "verify" || secondsLeft <= 0) return;
    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [isOpen, stage, secondsLeft]);

  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      unlockScroll();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.requestAnimationFrame(() => {
      if (stage === "request") nameInputRef.current?.focus();
      if (stage === "verify") codeInputRef.current?.focus();
      if (stage === "reset") newPasswordInputRef.current?.focus();
    });
  }, [isOpen, stage]);

  if (!isOpen) return null;

  const passwordValid = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(newPassword);
  const confirmValid =
    confirmPassword === newPassword && confirmPassword !== "";
  const nameValid = /^[가-힣a-zA-Z]{2,}$/.test(name);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canValidateEmail = nameValid;
  const codeValid = code.length === 6;
  const isExpired = stage === "verify" && secondsLeft <= 0;

  const toErrorText = (error: unknown, fallbackKey: string) => {
    const code = error instanceof Error ? error.message : "";
    return t(`errors.${API_ERROR_CODES.has(code) ? code : fallbackKey}`);
  };
  const labelClass = "flex flex-col gap-1 text-[13px] font-semibold text-gray-700";
  const inputClass = "font-normal";
  const hintClass = "text-[11px] font-normal leading-3.5 text-gray-400";
  const errorHintClass = "text-[11px] font-normal leading-3.5 text-red-500";
  const successHintClass = "text-[11px] font-normal leading-3.5 text-teal-600";

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched((prev) => ({ ...prev, name: true, email: true }));
    setServerFieldError(null);
    if (!nameValid) {
      nameInputRef.current?.focus();
      return;
    }
    if (!emailValid) {
      emailInputRef.current?.focus();
      return;
    }
    setIsLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, locale }),
      });
      const result = (await response.json()) as {
        error?: string;
        expiresIn?: number;
        isEmailSent?: boolean;
        devCode?: string;
      };

      if (!response.ok) throw new Error(result.error ?? "");

      setStage("verify");
      setTouched({});
      setCode("");
      setSecondsLeft(result.expiresIn ?? INITIAL_SECONDS);
      setDevCode(result.devCode ?? "");
      setMessage(result.isEmailSent ? t("codeSent") : t("devCodeShown"));
    } catch (error) {
      if (error instanceof Error && error.message === "name_not_found") {
        setServerFieldError("name");
        setTouched((prev) => ({ ...prev, name: true }));
        nameInputRef.current?.focus();
        return;
      }
      if (
        error instanceof Error &&
        (error.message === "email_not_found" ||
          error.message === "account_not_found")
      ) {
        setServerFieldError("email");
        setTouched((prev) => ({ ...prev, name: true, email: true }));
        emailInputRef.current?.focus();
        return;
      }
      setErrorMessage(toErrorText(error, "sendFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched((prev) => ({ ...prev, code: true }));
    if (!codeValid) {
      codeInputRef.current?.focus();
      return;
    }
    setIsLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(result.error ?? "");

      setStage("reset");
      setTouched({});
      setMessage(t("verified"));
    } catch (error) {
      setErrorMessage(toErrorText(error, "verifyFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched((prev) => ({
      ...prev,
      newPassword: true,
      confirmPassword: true,
    }));
    if (!passwordValid) {
      newPasswordInputRef.current?.focus();
      return;
    }
    if (!confirmValid) {
      confirmPasswordInputRef.current?.focus();
      return;
    }
    setIsLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, code, newPassword }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(result.error ?? "");

      setMessage(t("passwordChanged"));
      window.setTimeout(onClose, 1200);
    } catch (error) {
      setErrorMessage(toErrorText(error, "changeFailed"));
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/45 px-4 py-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="find-password-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="find-password-title"
              className="text-base font-semibold text-gray-900"
            >
              {t("title")}
            </h2>
          </div>
          <button
            type="button"
            aria-label={t("closeModal")}
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {stage === "request" && (
          <form
            className="mt-5 flex flex-col gap-4"
            noValidate
            onSubmit={handleSendCode}
          >
            <label className={labelClass}>
              {t("name")}
              <Input
                ref={nameInputRef}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setServerFieldError(null);
                }}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, name: true }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setTouched((prev) => ({ ...prev, name: true }));
                    if (!nameValid) return;
                    emailInputRef.current?.focus();
                  }
                }}
                className={inputClass}
                required
              />
              <span
                className={
                  (touched.name && !nameValid) || serverFieldError === "name"
                    ? errorHintClass
                    : hintClass
                }
              >
                {t(
                  (touched.name && !nameValid) || serverFieldError === "name"
                    ? "nameInvalid"
                    : "namePlaceholder",
                )}
              </span>
            </label>
            <label className={labelClass}>
              {t("email")}
              <Input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setServerFieldError(null);
                }}
                onBlur={() =>
                  setTouched((prev) => ({
                    ...prev,
                    email: canValidateEmail,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setTouched((prev) => ({
                      ...prev,
                      email: canValidateEmail,
                    }));
                  }
                }}
                className={inputClass}
                disabled={!canValidateEmail}
                required
              />
              <span
                className={
                  (canValidateEmail && touched.email && !emailValid) ||
                  serverFieldError === "email"
                    ? errorHintClass
                    : hintClass
                }
              >
                {t(
                  (canValidateEmail && touched.email && !emailValid) ||
                    serverFieldError === "email"
                    ? "emailInvalid"
                    : "emailPlaceholder",
                )}
              </span>
            </label>
            <Button
              type="submit"
              variant="teal"
              className="h-10 w-full"
              disabled={isLoading || !nameValid || !emailValid}
            >
              <Mail className="h-4 w-4" />
              {t("sendCode")}
            </Button>
          </form>
        )}

        {stage === "verify" && (
          <form
            className="mt-5 flex flex-col gap-4"
            onSubmit={handleVerifyCode}
          >
            {devCode && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t("devCode")}{" "}
                <span className="font-semibold tracking-[0.2em]">
                  {devCode}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg bg-teal-50 px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-teal-700">
                <Timer className="h-4 w-4" />
                {t("timeLeft")}
              </span>
              <span
                className={
                  isExpired
                    ? "font-semibold text-red-500"
                    : "font-semibold text-teal-700"
                }
              >
                {formatTime(secondsLeft)}
              </span>
            </div>
            <label className={labelClass}>
              {t("codeLabel")}
              <Input
                ref={codeInputRef}
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, code: true }))
                }
                className={inputClass}
                required
              />
              <span
                className={touched.code && !codeValid ? errorHintClass : hintClass}
              >
                {t(touched.code && !codeValid ? "codeInvalid" : "codePlaceholder")}
              </span>
            </label>
            <Button
              type="submit"
              variant="teal"
              className="h-10 w-full"
              disabled={isLoading || isExpired || code.length !== 6}
            >
              {t("verifyCode")}
            </Button>
          </form>
        )}

        {stage === "reset" && (
          <form
            className="mt-5 flex flex-col gap-4"
            onSubmit={handleResetPassword}
          >
            {message && !errorMessage && (
              <p className="text-sm text-teal-600">{message}</p>
            )}
            <label className={labelClass}>
              {t("newPassword")}
              <Input
                ref={newPasswordInputRef}
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, newPassword: true }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setTouched((prev) => ({ ...prev, newPassword: true }));
                    confirmPasswordInputRef.current?.focus();
                  }
                }}
                className={inputClass}
                required
              />
              <span
                className={
                  touched.newPassword && !passwordValid
                    ? errorHintClass
                    : hintClass
                }
              >
                {t(
                  touched.newPassword && !passwordValid
                    ? "passwordRule"
                    : "newPasswordPlaceholder",
                )}
              </span>
            </label>
            <label className={labelClass}>
              {t("confirmPassword")}
              <Input
                ref={confirmPasswordInputRef}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, confirmPassword: true }))
                }
                className={inputClass}
                required
              />
              <span
                className={
                  touched.confirmPassword && !confirmValid
                    ? errorHintClass
                    : confirmValid
                      ? successHintClass
                    : hintClass
                }
              >
                {t(
                  touched.confirmPassword && !confirmValid
                    ? "passwordMismatch"
                    : confirmValid
                      ? "passwordMatch"
                      : "confirmPasswordPlaceholder",
                )}
              </span>
            </label>
            <Button
              type="submit"
              variant="teal"
              className="h-10 w-full"
              disabled={isLoading || !passwordValid || !confirmValid}
            >
              {t("changePassword")}
            </Button>
          </form>
        )}

        {((stage !== "reset" && message) || errorMessage) && (
          <p
            className={`mt-4 text-sm ${errorMessage ? "text-red-500" : "text-teal-600"}`}
          >
            {errorMessage || message}
          </p>
        )}
      </div>
    </div>
  );
}
