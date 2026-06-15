"use client";

import { useRef, useState } from "react";
import { EyeIcon } from "./EyeIcon";

type FormValues = { name: string; email: string; password: string };

interface SignupFormProps {
  isLoading: boolean;
  isSuccess: boolean;
  errorMessage: string;
  requiredChecked: boolean;
  onSubmit: (values: FormValues) => void;
  onClearError: () => void;
  children: React.ReactNode;
}

export function SignupForm({
  isLoading,
  isSuccess,
  errorMessage,
  requiredChecked,
  onSubmit,
  onClearError,
  children,
}: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const nameValid = /^[가-힣a-zA-Z]{2,}$/.test(name);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password);
  const confirmPasswordValid = confirmPassword === password && confirmPassword !== "";

  const handleSubmit = () => {
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (!nameValid || !emailValid || !passwordValid || !confirmPasswordValid) return;
    if (!requiredChecked) return;
    onSubmit({ name, email, password });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          이름
        </label>
        <input
          id="name"
          ref={nameRef}
          autoFocus
          type="text"
          placeholder="한글 또는 영어 2자 이상 (예: 홍길동)"
          value={name}
          onChange={(e) => { setName(e.target.value); onClearError(); }}
          onBlur={() => { if (name) setTouched((p) => ({ ...p, name: true })); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); emailRef.current?.focus(); } }}
          className={`w-full border rounded-md px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${touched.name && !nameValid ? "border-red-400" : "border-gray-300"}`}
        />
        {touched.name && !nameValid && (
          <p className="text-xs text-red-500">한글 또는 영어로 2자 이상 입력해주세요.</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          id="email"
          ref={emailRef}
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); onClearError(); }}
          onBlur={() => { if (email) setTouched((p) => ({ ...p, email: true })); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); passwordRef.current?.focus(); } }}
          className={`w-full border rounded-md px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${touched.email && !emailValid ? "border-red-400" : "border-gray-300"}`}
        />
        {touched.email && !emailValid && (
          <p className="text-xs text-red-500">올바른 이메일을 입력해주세요.</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          비밀번호
        </label>
        <div className="relative">
          <input
            id="password"
            ref={passwordRef}
            type={showPassword ? "text" : "password"}
            placeholder="영문 + 숫자 포함 8자 이상"
            value={password}
            onChange={(e) => { setPassword(e.target.value); onClearError(); }}
            onBlur={() => { if (password) setTouched((p) => ({ ...p, password: true })); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmPasswordRef.current?.focus(); } }}
            className={`w-full border rounded-md px-3 py-2 pr-10 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${touched.password && !passwordValid ? "border-red-400" : "border-gray-300"}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <EyeIcon visible={showPassword} />
          </button>
        </div>
        {touched.password && !passwordValid && (
          <p className="text-xs text-red-500">영문과 숫자를 포함하여 8자 이상 입력해주세요.</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          비밀번호 확인
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            ref={confirmPasswordRef}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="비밀번호를 다시 입력하세요"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); onClearError(); }}
            onBlur={() => { if (confirmPassword) setTouched((p) => ({ ...p, confirmPassword: true })); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            className={`w-full border rounded-md px-3 py-2 pr-10 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 ${touched.confirmPassword && !confirmPasswordValid ? "border-red-400" : "border-gray-300"}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
            aria-pressed={showConfirmPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <EyeIcon visible={showConfirmPassword} />
          </button>
        </div>
        {touched.confirmPassword && !confirmPasswordValid && (
          <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
        )}
      </div>

      {children}

      {errorMessage && (
        <p className="text-sm text-red-500 text-center">{errorMessage}</p>
      )}

      {isSuccess && (
        <div className="text-sm text-teal-600 text-center bg-teal-50 rounded-md p-3">
          가입 완료! 이메일을 확인해 인증을 완료해주세요.
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!requiredChecked || isLoading || isSuccess}
        className="w-full btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed font-medium py-2.5 rounded-md transition-colors"
      >
        {isLoading ? "처리 중..." : "회원가입"}
      </button>
    </div>
  );
}
