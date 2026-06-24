import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

export function BusinessHeader() {
  const t = useTranslations("Business.header");
  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center h-16">
          <Link href="/business" className="flex items-end hover:opacity-80 transition-opacity">
            <Image src="/kantoMobileLogo.png" alt="kanto" width={40} height={40} className="brightness-0 invert" />
            <span className="text-white font-extrabold -ml-1.5 -mb-1">{t("label")}</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/main"
            className="text-sm font-medium text-gray-400 hover:text-teal-400 transition-colors"
          >
            {t("home")}
          </Link>
        </div>
      </div>
    </header>
  );
}
