import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants/routes";

const SERVICES = [
  { href: ROUTES.usedgoods, key: "usedgoods" },
  { href: ROUTES.jobs, key: "jobs" },
  { href: ROUTES.rental, key: "rental" },
] as const;

const LEGAL_LINKS = [
  { href: ROUTES.termsOfService, key: "termsOfService" },
  { href: ROUTES.privacyPolicy, key: "privacyPolicy" },
  { href: ROUTES.youthPolicy, key: "youthPolicy" },
] as const;

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="page-container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <Image
                src="/kantoLogo.png"
                alt="Kanto"
                width={1502}
                height={704}
                className="h-12 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-sm text-gray-400">
              {t.rich("tagline", { br: () => <br /> })}
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">
              {t("services.title")}
            </h4>
            <ul className="space-y-2 text-sm">
              {SERVICES.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-teal-500 transition-colors">
                    {t(`services.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">
              {t("support.title")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={ROUTES.report} className="hover:text-teal-500 transition-colors">
                  {t("support.report")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">
              {t("contact.title")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>{t("contact.email")}</li>
              <li>{t("contact.kakao")}</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>{t("copyright")}</p>
            <div className="flex gap-6">
              {LEGAL_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-teal-500 transition-colors">
                  {t(`legal.${item.key}`)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
