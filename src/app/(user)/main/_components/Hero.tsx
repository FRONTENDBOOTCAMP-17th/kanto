"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, Briefcase, Home, Heart, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const slides = [
  { key: "usedgoods", icon: ShoppingBag, link: "/usedgoods" },
  { key: "jobs", icon: Briefcase, link: "/job" },
  { key: "rental", icon: Home, link: "/rental" },
  { key: "community", icon: Users, link: "/community" },
  { key: "dating", icon: Heart, link: "/dating" },
] as const;

export default function Hero() {
  const t = useTranslations("Main");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrentSlide((p) => (p + 1) % slides.length), []);
  const prev = useCallback(() => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <div className="w-full bg-gray-50 pt-8 pb-0">
      <div className="page-container">
        <div
          className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden rounded-3xl shadow-xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {slides.map((slide, index) => {
            const Icon = slide.icon;
            return (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <div className={`w-full h-full bg-cyan-950 relative overflow-hidden`}>
                  {/* 배경 장식 */}
                  <div className="absolute -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-10 hidden md:block">
                    <Icon className="w-56 h-56 text-white" />
                  </div>

                  {/* 콘텐츠 */}
                  <div className="relative z-10 h-full flex flex-col justify-center px-4 md:px-16 max-w-2xl">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight drop-shadow break-keep">
                      {t(`hero.${slide.key}.title`)}
                    </h2>
                    <p className="text-sm sm:text-base text-white/85 mb-6 drop-shadow break-keep">
                      {t(`hero.${slide.key}.description`)}
                    </p>
                    <Link
                      href={slide.link}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-50 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] w-fit text-sm"
                    >
                      {t(`hero.${slide.key}.button`)}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 좌우 화살표 */}
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 cursor-pointer bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors z-10"
            aria-label={t("prevSlide")}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 cursor-pointer bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors z-10"
            aria-label={t("nextSlide")}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* 도트 인디케이터 */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "bg-white w-6" : "bg-white/50 hover:bg-white/75 w-1.5"
                }`}
                aria-label={t("slideIndicator", { index: index + 1 })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
