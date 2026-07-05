import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function LoginPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-cyan-50 to-emerald-100 flex items-center justify-center p-3 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal-700 transition-colors hover:text-teal-800 active:scale-100"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            {t("homeShort")}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="px-5 sm:px-8">
          <div className="mb-14 flex flex-col items-center">
            <Image
              src="/kantoLogo.png"
              alt="Kanto"
              width={240}
              height={113}
              priority
              className="h-auto w-44 select-none sm:w-48"
            />
            <p className="mt-2 text-[15px] font-medium text-gray-700">
              {t("welcome")}
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
