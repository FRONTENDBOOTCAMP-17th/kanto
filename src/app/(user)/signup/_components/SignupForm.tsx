"use client";

import { useEffect, useRef, useState } from "react";
import { checkEmailDuplication } from "../_lib/checkEmailDuplication";
import { useTranslations } from "next-intl";
import { Lock, Mail, User } from "lucide-react";
import { EyeIcon } from "./EyeIcon";
import { FormField } from "./FormField";

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
      <FormField
        id="name"
        ref={nameRef}
        autoFocus
        type="text"
        icon={User}
        ariaLabel={t("name")}
        placeholder={t("namePlaceholder")}
        value={name}
        onChange={(e) => { setName(e.target.value); onClearError(); }}
        onBlur={() => { if (name) setTouched((p) => ({ ...p, name: true })); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); emailRef.current?.focus(); } }}
        errorMessage={touched.name && !nameValid && t("nameError")}
      />

      <FormField
        id="email"
        ref={emailRef}
        type="email"
        icon={Mail}
        ariaLabel={t("email")}
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => { setEmail(e.target.value); setEmailDuplication(false); onClearError(); }}
        onBlur={handleEmailBlur}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); passwordRef.current?.focus(); } }}
        errorMessage={
          touched.email &&
          (!emailValid ? t("emailError") : emailDuplication && tSignup("emailExists"))
        }
      />

      <FormField
        id="password"
        ref={passwordRef}
        type={showPassword ? "text" : "password"}
        icon={Lock}
        ariaLabel={t("password")}
        placeholder={t("passwordPlaceholder")}
        value={password}
        onChange={(e) => { setPassword(e.target.value); onClearError(); }}
        onBlur={() => { if (password) setTouched((p) => ({ ...p, password: true })); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmPasswordRef.current?.focus(); } }}
        errorMessage={touched.password && !passwordValid && t("passwordError")}
        toggleButton={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            aria-pressed={showPassword}
            className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
          >
            <EyeIcon visible={showPassword} />
          </button>
        }
      />

      <FormField
        id="confirmPassword"
        ref={confirmPasswordRef}
        type={showConfirmPassword ? "text" : "password"}
        icon={Lock}
        ariaLabel={t("confirmPassword")}
        placeholder={t("confirmPlaceholder")}
        value={confirmPassword}
        onChange={(e) => { setConfirmPassword(e.target.value); onClearError(); }}
        onBlur={() => { if (confirmPassword) setTouched((p) => ({ ...p, confirmPassword: true })); }}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
        errorMessage={touched.confirmPassword && !confirmPasswordValid && t("confirmError")}
        successMessage={confirmPasswordValid && t("confirmSuccess")}
        toggleButton={
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
            aria-pressed={showConfirmPassword}
            className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
          >
            <EyeIcon visible={showConfirmPassword} />
          </button>
        }
      />

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
