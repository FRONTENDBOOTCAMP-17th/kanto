"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
}

export default function RelatedItemsCarousel({ title, items }: Props) {
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
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
    if (delta > 50 && page < totalPages - 1) setPage((p) => p + 1);
    if (delta < -50 && page > 0) setPage((p) => p - 1);
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-2 md:mt-4 border border-gray-200 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="relative">
        {totalPages > 1 && (
          <>
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 disabled:opacity-20 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages - 1}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 disabled:opacity-20 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </>
        )}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {visible.map((item) => (
            <Link key={item.id} href={item.href} className="block">
              <div className="relative w-full aspect-square overflow-hidden border rounded-xl">
                <ImageWithFallback
                  src={item.imageSrc ?? "/fallback-image.svg"}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
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
  );
}
