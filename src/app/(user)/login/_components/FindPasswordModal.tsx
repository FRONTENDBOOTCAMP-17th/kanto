"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Mail, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_SECONDS = 180;

type Stage = "request" | "verify" | "reset";

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
  const confirmValid = confirmPassword === newPassword && confirmPassword !== "";
  const isExpired = stage === "verify" && secondsLeft <= 0;

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
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

      if (!response.ok) throw new Error(result.error ?? "인증번호 발송에 실패했습니다.");

      setStage("verify");
      setCode("");
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

      if (!response.ok) throw new Error(result.error ?? "인증번호 확인에 실패했습니다.");

      setStage("reset");
      setMessage("인증되었습니다. 새 비밀번호를 입력해주세요.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "인증번호 확인에 실패했습니다.");
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

      if (!response.ok) throw new Error(result.error ?? "비밀번호 변경에 실패했습니다.");

      setMessage("비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.");
      window.setTimeout(onClose, 1200);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "비밀번호 변경에 실패했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4"
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
            <h2 id="find-password-title" className="text-base font-semibold text-gray-900">
              비밀번호 찾기
            </h2>
          </div>
          <button
            type="button"
            aria-label="비밀번호 찾기 모달 닫기"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        
        {stage === "request" && (
          <form className="mt-5 flex flex-col gap-4" onSubmit={handleSendCode}>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              이름
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="가입 시 입력한 이름"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              이메일
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="가입 시 사용한 이메일"
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
              인증번호 보내기
            </Button>
          </form>
        )}

        
        {stage === "verify" && (
          <form className="mt-5 flex flex-col gap-4" onSubmit={handleVerifyCode}>
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
            <Button
              type="submit"
              variant="teal"
              className="h-10 w-full"
              disabled={isLoading || isExpired || code.length !== 6}
            >
              인증번호 확인
            </Button>
          </form>
        )}

        
        {stage === "reset" && (
          <form className="mt-5 flex flex-col gap-4" onSubmit={handleResetPassword}>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              새 비밀번호
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="영문 + 숫자 포함 8자 이상"
                required
              />
              {newPassword && !passwordValid && (
                <span className="text-xs text-red-500">영문과 숫자를 포함하여 8자 이상 입력해주세요.</span>
              )}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              새 비밀번호 확인
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                required
              />
              {confirmPassword && !confirmValid && (
                <span className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</span>
              )}
            </label>
            <Button
              type="submit"
              variant="teal"
              className="h-10 w-full"
              disabled={isLoading || !passwordValid || !confirmValid}
            >
              비밀번호 변경하기
            </Button>
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
