"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCarousel } from "@/hooks/useCarousel";

export default function ImageCarousel({ images }: { images: string[] }) {
  const { currentIndex, prevIndex, direction, isAnimating, navigate, dragHandlers } =
    useCarousel(images.length);

  if (images.length === 0) return <div>이미지가 없습니다.</div>;

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
      <div className="relative w-full aspect-square overflow-hidden" {...dragHandlers}>
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
          className="absolute cursor-pointer left-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-1.5 z-10"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => navigate("right")}
          className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-1.5 z-10"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="flex gap-2 border-t-2 border-gray-200 p-2">
        {images.map((image, index) => (
          <Image
            key={image}
            src={image}
            alt={`썸네일 ${index + 1}`}
            width={64}
            height={64}
            onClick={() => navigate(index > currentIndex ? "right" : "left", index)}
            className={
              currentIndex === index
                ? "border-3 border-teal-400 rounded-xl overflow-hidden cursor-pointer object-contain"
                : "border-3 rounded-xl overflow-hidden cursor-pointer object-contain"
            }
          />
        ))}
      </div>
    </div>
  );
}
