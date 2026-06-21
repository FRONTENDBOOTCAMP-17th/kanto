"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { TERMS_LIST } from "../_config";

const termsNavigationList = TERMS_LIST.map(({ type }) => ({
  type,
  href: `/terms/${type}`,
}));

export default function TermsNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Terms.items");

  const navRef = useRef<HTMLUListElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const current = termsNavigationList.find(({ href }) => href === pathname);

  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = navRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    navRef.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  };

  return (
    <nav className="border-b border-gray-700 bg-gray-900">
      <div className="max-w-3xl mx-auto px-4">

        <div className="md:hidden relative">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="w-full flex items-center justify-between py-3 text-sm font-medium text-teal-400"
          >
            <span>{current ? t(current.type) : ""}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <ul className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-b-lg z-10 overflow-hidden">
              {termsNavigationList.map(({ type, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    prefetch={false}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 text-sm transition-colors ${
                      pathname === href
                        ? "text-teal-400 bg-gray-700"
                        : "text-gray-400 hover:text-teal-400 hover:bg-gray-700"
                    }`}
                  >
                    {t(type)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative hidden md:block">
          {showLeft && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 text-gray-400 hover:text-teal-400 transition-colors"
                aria-label="왼쪽으로 스크롤"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
          {showRight && (
            <>
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-gray-900 to-transparent z-10 pointer-events-none" />
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 text-gray-400 hover:text-teal-400 transition-colors"
                aria-label="오른쪽으로 스크롤"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          <ul
            ref={navRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {termsNavigationList.map(({ type, href }) => (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  prefetch={false}
                  className={`inline-block py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    pathname === href
                      ? "border-teal-400 text-teal-400"
                      : "border-transparent text-gray-400 hover:text-teal-400"
                  }`}
                >
                  {t(type)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </nav>
  );
}
