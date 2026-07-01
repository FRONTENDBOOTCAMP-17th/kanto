"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LoginButton from "./LoginButton";
import { FindPasswordModal } from "./FindPasswordModal";

export default function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFindPasswordOpen, setIsFindPasswordOpen] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setIsLoading(false);

    if (!res.ok) {
      const { code } = await res.json();
      if (res.status === 429) {
        setErrorMsg(t("errors.tooManyAttempts"));
      } else if (code === "invalid_credentials") {
        setErrorMsg(t("errors.invalidCredentials"));
      } else if (code === "email_not_confirmed") {
        setErrorMsg(t("errors.emailNotConfirmed"));
      } else {
        setErrorMsg(t("errors.generic"));
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
      setErrorMsg(t("errors.generic"));
      return;
    }
  };

  return (
    <>
      <button
        onClick={() => {
          router.push("/");
          router.refresh();
        }}
        className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>

      <div className="space-y-3 mb-4">
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
        <LoginButton
          variant="email"
          onClick={() => setShowEmailForm(!showEmailForm)}
        />
      </div>

      {showEmailForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4 mt-6"
        >
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {errorMsg && (
            <>
              <p className="text-red-500 text-sm">{errorMsg}</p>
              <div className="flex items-center justify-center gap-1.5 text-sm">
                <span className="text-gray-500">{t("forgotPassword")}</span>
                <button
                  type="button"
                  onClick={() => setIsFindPasswordOpen(true)}
                  className="font-semibold text-teal-500 hover:text-teal-600"
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
            className="w-full"
          >
            {t("loginButton")}
          </Button>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {t("noAccountInline")}{" "}
              <Link
                href="/signup"
                className="text-teal-500 hover:text-teal-600 font-semibold"
              >
                {t("signup")}
              </Link>
            </p>
          </div>
        </form>
      )}

      {!showEmailForm && (
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
      )}

      <FindPasswordModal
        isOpen={isFindPasswordOpen}
        onClose={() => setIsFindPasswordOpen(false)}
      />
    </>
  );
}
