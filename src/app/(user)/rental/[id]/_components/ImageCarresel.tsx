"use client";

import Image from "next/image";
import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCarousel } from "@/hooks/useCarousel";

export default function ImageCarousel({ images }: { images: string[] }) {
  const t = useTranslations("Common");
  const { currentIndex, prevIndex, direction, isAnimating, navigate, dragHandlers } =
    useCarousel(images.length);
  const thumbRef = useRef<HTMLDivElement>(null);
  const adjacentIndexes = useMemo(() => {
    if (images.length <= 1) return [];
    const prev = (currentIndex - 1 + images.length) % images.length;
    const next = (currentIndex + 1) % images.length;
    return Array.from(new Set([prev, next])).filter((idx) => idx !== currentIndex);
  }, [currentIndex, images.length]);

  const scrollThumbs = (dir: "left" | "right") => {
    thumbRef.current?.scrollBy({ left: dir === "right" ? 120 : -120, behavior: "smooth" });
  };

  if (images.length === 0)
    return (
      <div className="relative aspect-square md:aspect-auto md:h-full overflow-hidden bg-gray-100">
        <ImageWithFallback
          src="/fallback-image.svg"
          alt={t("carousel.noImage")}
          fill
          className="object-contain"
        />
      </div>
    );

  return (
    <div className="overflow-hidden aspect-square md:aspect-auto md:h-full flex flex-col bg-gray-100">
      <div className="relative w-full flex-1 overflow-hidden" {...dragHandlers}>
        {adjacentIndexes.map((idx) => (
          <Image
            key={`preload-${idx}`}
            src={images[idx]}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="pointer-events-none invisible object-contain"
            draggable={false}
            loading="eager"
            aria-hidden
          />
        ))}
        {prevIndex !== null && (
          <div
            className={`absolute inset-0 ${
              direction === "right" ? "animate-slide-out-left" : "animate-slide-out-right"
            }`}
          >
            <Image
              src={images[prevIndex]}
              alt={t("carousel.image")}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              draggable={false}
              loading="eager"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}

        <div
          className={`absolute inset-0 ${
            isAnimating
              ? direction === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
              : ""
          }`}
        >
          <Image
            src={images[currentIndex]}
            alt={t("carousel.image")}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={currentIndex === 0}
            loading={currentIndex === 0 ? undefined : "eager"}
            className="object-contain"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        <p className="absolute right-3 top-3 bg-black/70 text-white text-xs px-2.5 py-1 z-10 tracking-widest rounded-sm">
          {currentIndex + 1} / {images.length}
        </p>
        <button
          onClick={() => navigate("left")}
          aria-label={t("carousel.prevImage")}
          className="absolute cursor-pointer left-3 top-1/2 -translate-y-1/2 bg-white/90 p-2 z-10 active:scale-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate("right")}
          aria-label={t("carousel.nextImage")}
          className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 bg-white/90 p-2 z-10 active:scale-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="relative border-t border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => scrollThumbs("left")}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-10 items-center px-1 bg-gradient-to-r from-white to-transparent active:scale-100"
          aria-label={t("carousel.prevImage")}
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>

        <div
          ref={thumbRef}
          className="flex gap-2 p-2 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => navigate(index > currentIndex ? "right" : "left", index)}
              aria-label={t("carousel.goToImage", { index: index + 1 })}
              aria-pressed={currentIndex === index}
              className={`relative shrink-0 w-14 h-14 overflow-hidden focus:outline-none active:scale-100 transition-opacity ${
                currentIndex === index ? "ring-2 ring-gray-900" : "opacity-50 hover:opacity-100"
              }`}
            >
              <Image
                src={image}
                alt={t("carousel.thumbnail", { index: index + 1 })}
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollThumbs("right")}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-10 items-center px-1 bg-gradient-to-l from-white to-transparent active:scale-100"
          aria-label={t("carousel.nextImage")}
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
