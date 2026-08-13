"use client";

import { useEffect, useRef, useState } from "react";
import { checkEmailDuplication } from "../_lib/checkEmailDuplication";
import { useTranslations } from "next-intl";
import { Lock, Mail, User } from "lucide-react";
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
  const [emailDuplication, setEmailDuplication] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const t = useTranslations("Signup.form");
  const tSignup = useTranslations("Signup");

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const latestEmailRef = useRef(email);
  useEffect(() => {
    latestEmailRef.current = email;
  }, [email]);

  const nameValid = /^[가-힣a-zA-Z]{2,}$/.test(name);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password);
  const confirmPasswordValid = confirmPassword === password && confirmPassword !== "";
  const inputClass =
    "w-full border-b bg-transparent py-3 pr-2 pl-8 text-base text-gray-950 placeholder:text-gray-400 outline-none transition-colors focus:border-teal-400 sm:text-sm";
  const passwordInputClass = `${inputClass} pr-11`;
  const iconClass =
    "pointer-events-none absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 text-gray-400";
  const errorClass = "text-xs font-medium text-red-500";

  const handleSubmit = () => {
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (!nameValid || !emailValid || !passwordValid || !confirmPasswordValid) return;
    if (emailDuplication) return;
    if (!requiredChecked) return;
    onSubmit({ name, email, password });
  };

  const handleEmailBlur = async () => {
    if (!email) return;
    setTouched((p) => ({ ...p, email: true }));
    if (!emailValid) return;

    const checkedEmail = email;
    const exists = await checkEmailDuplication(checkedEmail);
    if (latestEmailRef.current !== checkedEmail) return;
    setEmailDuplication(exists);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="relative">
          <User className={iconClass} strokeWidth={1.8} aria-hidden />
          <input
            id="name"
            ref={nameRef}
            autoFocus
            type="text"
            aria-label={t("name")}
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => { setName(e.target.value); onClearError(); }}
            onBlur={() => { if (name) setTouched((p) => ({ ...p, name: true })); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); emailRef.current?.focus(); } }}
            className={`${inputClass} ${touched.name && !nameValid ? "border-red-400 focus:border-red-400" : "border-gray-200"}`}
          />
        </div>
        {touched.name && !nameValid && (
          <p className={errorClass}>{t("nameError")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="relative">
          <Mail className={iconClass} strokeWidth={1.8} aria-hidden />
          <input
            id="email"
            ref={emailRef}
            type="email"
            aria-label={t("email")}
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailDuplication(false); onClearError(); }}
            onBlur={handleEmailBlur}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); passwordRef.current?.focus(); } }}
            className={`${inputClass} ${touched.email && (!emailValid || emailDuplication) ? "border-red-400 focus:border-red-400" : "border-gray-200"}`}
          />
        </div>
        {touched.email && (!emailValid ? (
          <p className={errorClass}>{t("emailError")}</p>
        ) : emailDuplication && (
          <p className={errorClass}>{tSignup("emailExists")}</p>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="relative">
          <Lock className={iconClass} strokeWidth={1.8} aria-hidden />
          <input
            id="password"
            ref={passwordRef}
            type={showPassword ? "text" : "password"}
            aria-label={t("password")}
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => { setPassword(e.target.value); onClearError(); }}
            onBlur={() => { if (password) setTouched((p) => ({ ...p, password: true })); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmPasswordRef.current?.focus(); } }}
            className={`${passwordInputClass} ${touched.password && !passwordValid ? "border-red-400 focus:border-red-400" : "border-gray-200"}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            aria-pressed={showPassword}
            className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
          >
            <EyeIcon visible={showPassword} />
          </button>
        </div>
        {touched.password && !passwordValid && (
          <p className={errorClass}>{t("passwordError")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="relative">
          <Lock className={iconClass} strokeWidth={1.8} aria-hidden />
          <input
            id="confirmPassword"
            ref={confirmPasswordRef}
            type={showConfirmPassword ? "text" : "password"}
            aria-label={t("confirmPassword")}
            placeholder={t("confirmPlaceholder")}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); onClearError(); }}
            onBlur={() => { if (confirmPassword) setTouched((p) => ({ ...p, confirmPassword: true })); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            className={`${passwordInputClass} ${touched.confirmPassword && !confirmPasswordValid ? "border-red-400 focus:border-red-400" : "border-gray-200"}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
            aria-pressed={showConfirmPassword}
            className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
          >
            <EyeIcon visible={showConfirmPassword} />
          </button>
        </div>
        {touched.confirmPassword && !confirmPasswordValid && (
          <p className={errorClass}>{t("confirmError")}</p>
        )}
        {confirmPasswordValid && (
          <p className="text-xs font-medium text-teal-600">{t("confirmSuccess")}</p>
        )}
      </div>

      {children}

      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">{errorMessage}</p>
      )}

      {isSuccess && (
        <div className="whitespace-pre-line rounded-xl bg-teal-50 p-3 text-center text-sm font-medium text-teal-700">
          {t("success")}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!requiredChecked || isLoading || isSuccess}
        className="w-full rounded-md bg-teal-500 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-teal-600 active:bg-teal-700 disabled:bg-gray-300 disabled:text-white disabled:shadow-none disabled:cursor-not-allowed sm:text-sm"
      >
        {isLoading ? t("processing") : t("submit")}
      </button>
    </div>
  );
}
