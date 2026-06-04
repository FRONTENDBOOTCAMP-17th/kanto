"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleSubmit = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("로그인 실패: " + error.message);
      return;
    }

    router.push("/");
  };

  const handleSocialLogin = async (
    provider: "kakao" | "google" | "facebook",
  ) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });

    if (error) {
      alert("소셜 로그인 실패: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 relative min-h-[800px] flex flex-col">
        <button
          onClick={() => router.push("/")}
          className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex flex-col items-center justify-center flex-1 mb-8 mt-4">
          <Image
            src="/logoIcon+Text.png"
            alt="Kanto"
            width={80}
            height={80}
            className="h-20 w-auto"
          />
        </div>

        <div className="space-y-3 mb-4">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 h-11 bg-[#FEE500] hover:bg-[#FEE500]/90 border-[#FEE500]"
            onClick={() => handleSocialLogin("kakao")}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#000000"
                d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"
              />
            </svg>
            <span className="text-black/85">카카오로 계속하기</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 h-11"
            onClick={() => handleSocialLogin("google")}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 h-11"
            onClick={() => handleSocialLogin("facebook")}
          >
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook으로 계속하기
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={() => setShowEmailForm(!showEmailForm)}
          >
            이메일로 로그인
          </Button>
        </div>

        {showEmailForm && (
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full bg-teal-500 hover:bg-teal-600"
            >
              로그인
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{" "}
                <Link
                  href="/signup"
                  className="text-teal-500 hover:text-teal-600 font-semibold"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        )}

        {!showEmailForm && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              아직 계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="text-teal-500 hover:text-teal-600 font-semibold underline"
              >
                회원가입 하러가기
              </Link>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
