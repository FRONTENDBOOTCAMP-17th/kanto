"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { TERMS_LIST } from "../_config";

const termsNavigationList = TERMS_LIST.map(({ type, label }) => ({
  label,
  href: `/terms/${type}`,
}));

export default function TermsNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const current = termsNavigationList.find(({ href }) => href === pathname);

  return (
    <nav className="border-b border-gray-700 bg-gray-900">
      <div className="max-w-3xl mx-auto px-4">

        {/* 모바일 드롭다운 */}
        <div className="md:hidden relative">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="w-full flex items-center justify-between py-3 text-sm font-medium text-teal-400"
          >
            <span>{current?.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <ul className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-b-lg z-10 overflow-hidden">
              {termsNavigationList.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 text-sm transition-colors ${
                      pathname === href
                        ? "text-teal-400 bg-gray-700"
                        : "text-gray-400 hover:text-teal-400 hover:bg-gray-700"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 데스크탑 탭 */}
        <ul className="hidden md:flex gap-6">
          {termsNavigationList.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className={`inline-block py-3 text-sm font-medium border-b-2 transition-colors ${
                  pathname === href
                    ? "border-teal-400 text-teal-400"
                    : "border-transparent text-gray-400 hover:text-teal-400"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

      </div>
    </nav>
  );
}
