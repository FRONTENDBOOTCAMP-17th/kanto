"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";

export interface RelatedItem {
  id: number;
  href: string;
  imageSrc: string | null;
  title: string;
  priceText: string;
  overlayLabel?: string;
}

interface Props {
  title: string;
  items: RelatedItem[];
  variant?: "boxed" | "plain";
}

export default function RelatedItemsCarousel({ title, items, variant = "boxed" }: Props) {
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [slideDir, setSlideDir] = useState<"next" | "prev">("next");
  const touchStartX = useRef(0);

  useEffect(() => {
    const update = () => setItemsPerPage(window.innerWidth >= 640 ? 4 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const visible = items.slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 50 && page < totalPages - 1) { setSlideDir("next"); setPage((p) => p + 1); }
    if (delta < -50 && page > 0) { setSlideDir("prev"); setPage((p) => p - 1); }
  };

  if (items.length === 0) return null;

  const isPlain = variant === "plain";

  return (
    <div className={isPlain ? "" : "mt-6 pt-6 border-t border-gray-200"}>
      {isPlain ? (
        <div className="flex items-center gap-1.5 mb-3">
          <h2 className="text-xl font-black text-gray-700">{title}</h2>
          <TrendingUp className="w-6 h-6 -mb-2 text-teal-500" />
        </div>
      ) : (
        <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-400 mb-4">{title}</h2>
      )}
      <div className="relative">
        {totalPages > 1 && (
          <>
            <button
              onClick={() => { setSlideDir("prev"); setPage((p) => p - 1); }}
              disabled={page === 0}
              aria-label="이전"
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-default"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setSlideDir("next"); setPage((p) => p + 1); }}
              disabled={page === totalPages - 1}
              aria-label="다음"
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-default"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        <div className="overflow-hidden">
        <div
          key={page}
          className={`grid grid-cols-2 sm:grid-cols-4 gap-5 px-6 ${
            slideDir === "next" ? "animate-slide-in-right" : "animate-slide-in-left"
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {visible.map((item) => (
            <Link key={item.id} href={item.href} className="block active:scale-[1.03]">
              <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-100">
                <ImageWithFallback
                  src={item.imageSrc ?? "/fallback-image.svg"}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
                {item.overlayLabel && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                    <span className="text-base md:text-lg font-bold text-white">{item.overlayLabel}</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium line-clamp-1 mt-1">{item.title}</p>
              <p className="text-sm text-orange-500">{item.priceText}</p>
            </Link>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}
