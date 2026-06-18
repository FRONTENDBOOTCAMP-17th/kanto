"use client";

import { FormEvent, useEffect, useState } from "react";
import { Mail, ShieldCheck, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_SECONDS = 180;

interface IdentityVerificationModalProps {
  isOpen: boolean;
  defaultName: string;
  defaultEmail: string;
  onClose: () => void;
  onVerified: () => void;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return `${minutes}:${String(restSeconds).padStart(2, "0")}`;
}

export function IdentityVerificationModal({
  isOpen,
  defaultName,
  defaultEmail,
  onClose,
  onVerified,
}: IdentityVerificationModalProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [devCode, setDevCode] = useState("");

  useEffect(() => {
    if (!isOpen || !isCodeSent || secondsLeft <= 0) return;

    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isCodeSent, isOpen, secondsLeft]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sendCode = async () => {
    setIsSending(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/profile/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const result = (await response.json()) as {
        error?: string;
        expiresIn?: number;
        isEmailSent?: boolean;
        devCode?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "인증번호 발송에 실패했습니다.");
      }

      setCode("");
      setIsCodeSent(true);
      setSecondsLeft(result.expiresIn ?? INITIAL_SECONDS);
      setDevCode(result.devCode ?? "");
      setMessage(
        result.isEmailSent
          ? "입력한 이메일로 인증번호를 보냈습니다."
          : "메일 발송 키가 없어 개발용 인증번호를 표시합니다.",
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendCode();
  };

  const handleVerifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsVerifying(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/profile/verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "본인인증에 실패했습니다.");
      }

      setMessage("본인인증이 완료되었습니다.");
      onVerified();
      window.setTimeout(onClose, 700);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "본인인증에 실패했습니다.");
    } finally {
      setIsVerifying(false);
    }
  };

  const isExpired = isCodeSent && secondsLeft <= 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-verification-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-500" />
            <h2 id="identity-verification-title" className="text-base font-semibold text-gray-900">
              본인인증
            </h2>
          </div>
          <button
            type="button"
            aria-label="본인인증 모달 닫기"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSendSubmit}>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            이름
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="이름을 입력해주세요"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            이메일
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="이메일을 입력해주세요"
              required
            />
          </label>
          <Button
            type="submit"
            variant="teal"
            className="h-10 w-full"
            disabled={isSending || !name.trim() || !email.trim()}
          >
            <Mail className="h-4 w-4" />
            {isCodeSent ? "인증번호 다시 보내기" : "인증번호 보내기"}
          </Button>
        </form>

        {isCodeSent && (
          <form className="mt-5 flex flex-col gap-4" onSubmit={handleVerifySubmit}>
            {devCode && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                개발용 인증번호: <span className="font-semibold tracking-[0.2em]">{devCode}</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg bg-teal-50 px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-teal-700">
                <Timer className="h-4 w-4" />
                남은 인증 시간
              </span>
              <span className={isExpired ? "font-semibold text-red-500" : "font-semibold text-teal-700"}>
                {formatTime(secondsLeft)}
              </span>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              인증번호
              <Input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder="6자리 인증번호"
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={onClose}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="teal"
                className="h-10"
                disabled={isVerifying || isExpired || code.length !== 6}
              >
                인증 완료
              </Button>
            </div>
          </form>
        )}

        {(message || errorMessage) && (
          <p className={`mt-4 text-sm ${errorMessage ? "text-red-500" : "text-teal-600"}`}>
            {errorMessage || message}
          </p>
        )}
      </div>
    </div>
  );
}
