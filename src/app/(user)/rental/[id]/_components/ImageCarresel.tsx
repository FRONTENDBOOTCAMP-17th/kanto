"use client";

import Image from "next/image";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCarousel } from "@/hooks/useCarousel";

export default function ImageCarousel({ images }: { images: string[] }) {
  const { currentIndex, prevIndex, direction, isAnimating, navigate, dragHandlers } =
    useCarousel(images.length);

  if (images.length === 0)
    return (
      <div className="relative aspect-square md:aspect-auto md:h-full border-2 border-gray-200 rounded-2xl overflow-hidden">
        <ImageWithFallback
          src="/fallback-image.svg"
          alt="이미지 없음"
          fill
          className="object-contain"
        />
      </div>
    );

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden aspect-square md:aspect-auto md:h-full flex flex-col">
      <div className="relative w-full flex-1 overflow-hidden" {...dragHandlers}>
        {prevIndex !== null && (
          <div
            className={`absolute inset-0 ${
              direction === "right" ? "animate-slide-out-left" : "animate-slide-out-right"
            }`}
          >
            <Image
              src={images[prevIndex]}
              alt="숙소 이미지"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              draggable={false}
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
            alt="숙소 이미지"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={currentIndex === 0}
            className="object-contain"
            draggable={false}
          />
        </div>

        <p className="absolute right-4 top-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-xl z-10">
          {currentIndex + 1} / {images.length}
        </p>
        <button
          onClick={() => navigate("left")}
          aria-label="이전 이미지"
          className="absolute cursor-pointer left-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-1.5 z-10"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => navigate("right")}
          aria-label="다음 이미지"
          className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-1.5 z-10"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="flex gap-2 border-t-2 border-gray-200 p-2">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => navigate(index > currentIndex ? "right" : "left", index)}
            aria-label={`${index + 1}번째 이미지로 이동`}
            aria-pressed={currentIndex === index}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-xl"
          >
            <Image
              src={image}
              alt={`썸네일 ${index + 1}`}
              width={64}
              height={64}
              className={
                currentIndex === index
                  ? "border-3 border-teal-400 rounded-xl overflow-hidden object-contain"
                  : "border-3 rounded-xl overflow-hidden object-contain"
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
}
