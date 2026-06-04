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
import LoginButton from "./_components/LoginButton";

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
          <LoginButton variant="kakao" onClick={() => handleSocialLogin("kakao")} />
          <LoginButton variant="google" onClick={() => handleSocialLogin("google")} />
          <LoginButton variant="facebook" onClick={() => handleSocialLogin("facebook")} />
          <LoginButton variant="email" onClick={() => setShowEmailForm(!showEmailForm)} />
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
