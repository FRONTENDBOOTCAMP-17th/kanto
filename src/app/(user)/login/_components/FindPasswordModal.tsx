"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Mail, Timer, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_SECONDS = 180;

type Stage = "request" | "verify" | "reset";

// 서버(reset-password API)가 내려주는 에러 코드 → FindPassword.errors.* 키
const API_ERROR_CODES = new Set([
  "missing_fields",
  "account_not_found",
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

  useEffect(() => {
    if (!isOpen || stage !== "verify" || secondsLeft <= 0) return;
    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [isOpen, stage, secondsLeft]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const passwordValid = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(newPassword);
  const confirmValid =
    confirmPassword === newPassword && confirmPassword !== "";
  const isExpired = stage === "verify" && secondsLeft <= 0;

  const toErrorText = (error: unknown, fallbackKey: string) => {
    const code = error instanceof Error ? error.message : "";
    return t(`errors.${API_ERROR_CODES.has(code) ? code : fallbackKey}`);
  };

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setCode("");
      setSecondsLeft(result.expiresIn ?? INITIAL_SECONDS);
      setDevCode(result.devCode ?? "");
      setMessage(result.isEmailSent ? t("codeSent") : t("devCodeShown"));
    } catch (error) {
      setErrorMessage(toErrorText(error, "sendFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setMessage(t("verified"));
    } catch (error) {
      setErrorMessage(toErrorText(error, "verifyFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordValid || !confirmValid) return;
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
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/45 px-4"
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
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-teal-500" />
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
          <form className="mt-5 flex flex-col gap-4" onSubmit={handleSendCode}>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {t("name")}
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("namePlaceholder")}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {t("email")}
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("emailPlaceholder")}
                required
              />
            </label>
            <Button
              type="submit"
              variant="teal"
              className="h-10 w-full"
              disabled={isLoading || !name.trim() || !email.trim()}
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
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {t("codeLabel")}
              <Input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
                placeholder={t("codePlaceholder")}
                required
              />
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
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {t("newPassword")}
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={t("newPasswordPlaceholder")}
                required
              />
              {newPassword && !passwordValid && (
                <span className="text-xs text-red-500">
                  {t("passwordRule")}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {t("confirmPassword")}
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t("confirmPasswordPlaceholder")}
                required
              />
              {confirmPassword && !confirmValid && (
                <span className="text-xs text-red-500">
                  {t("passwordMismatch")}
                </span>
              )}
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

        {(message || errorMessage) && (
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
