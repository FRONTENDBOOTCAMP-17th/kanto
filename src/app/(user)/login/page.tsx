import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { AuthHero } from "../_components/AuthHero";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function LoginPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="flex min-h-screen bg-white">
      <AuthHero />
      <div className="flex w-full flex-col p-3 sm:px-6 lg:w-120 lg:shrink-0 lg:px-10 xl:w-140">
        <div className="flex items-center justify-end pt-3">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md px-5 sm:px-8">
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
    </div>
  );
}
