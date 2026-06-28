import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants/routes";

const NAV_LINKS = [
  { href: ROUTES.usedgoods, key: "services.usedgoods" },
  { href: ROUTES.jobs, key: "services.jobs" },
  { href: ROUTES.rental, key: "services.rental" },
  { href: ROUTES.termsOfService, key: "legal.termsOfService" },
  { href: ROUTES.privacyPolicy, key: "legal.privacyPolicy" },
  { href: ROUTES.youthPolicy, key: "legal.youthPolicy" },
] as const;

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-gray-50 text-gray-500 py-10 border-t border-[#f0f0f0]">
      <div className="page-container flex flex-col items-center gap-4 text-sm text-center">
        <Image
          src="/kantoLogo.png"
          alt="Kanto"
          width={1502}
          height={704}
          className="h-8 w-auto"
        />

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {NAV_LINKS.map((item, i) => (
            <span key={item.href} className="flex items-center gap-4">
              {i !== 0 && <span className="text-gray-300">|</span>}
              <Link href={item.href} className="hover:text-teal-600 transition-colors">
                {t(item.key)}
              </Link>
            </span>
          ))}
        </div>

        <p className="text-gray-400">
          {t("contact.email")}&nbsp;&nbsp;|&nbsp;&nbsp;{t("contact.kakao")}
        </p>

        <p className="text-gray-300">{t("copyright")}</p>
      </div>
    </footer>
  );
}
