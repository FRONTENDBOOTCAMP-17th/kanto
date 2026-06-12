import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/constants/routes";

const SERVICES = [
  { href: ROUTES.usedgoods, label: "중고거래" },
  { href: ROUTES.jobs, label: "구인구직" },
  { href: ROUTES.rental, label: "방렌트" },
  { href: ROUTES.community, label: "한인 커뮤니티" },
];

const LEGAL_LINKS = [
  { href: ROUTES.termsOfService, label: "이용약관" },
  { href: ROUTES.privacyPolicy, label: "개인정보처리방침" },
  { href: ROUTES.locationPolicy, label: "위치기반서비스" },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <Image
                src="/logoIcon+Text.png"
                alt="Kanto"
                width={1502}
                height={704}
                className="h-12 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-sm text-gray-400">
              필리핀 한인을 위한
              <br />
              커뮤니티 플랫폼
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">서비스</h4>
            <ul className="space-y-2 text-sm">
              {SERVICES.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-teal-500 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={ROUTES.report} className="hover:text-teal-500 transition-colors">
                  문의/신고하기
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">연락처</h4>
            <ul className="space-y-2 text-sm">
              <li>이메일: support@kanto.ph</li>
              <li>카카오톡: @kanto</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2026 Kanto. All rights reserved.</p>
            <div className="flex gap-6">
              {LEGAL_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-teal-500 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}