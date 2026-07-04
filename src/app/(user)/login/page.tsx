import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function LoginPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-cyan-50 to-emerald-100 flex items-center justify-center px-3 py-5 sm:px-6 sm:py-10">
      <div className="w-full max-w-md px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal-700 transition-colors hover:text-teal-800"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            {t("home")}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="my-24 flex w-full justify-center">
          <Image
            src="/kantoLogo.png"
            alt="Kanto"
            width={240}
            height={113}
            priority
            className="h-auto w-56 select-none sm:w-60"
          />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
