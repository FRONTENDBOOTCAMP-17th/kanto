"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return <div>이미지가 없습니다.</div>;

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
      <div className="relative w-full aspect-square">
        <Image
          src={images[currentIndex]}
          alt="숙소 이미지"
          fill
          className="object-cover"
        />
        <p className="absolute right-4 top-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-xl">
          {currentIndex + 1} / {images.length}
        </p>
        <button
          onClick={() =>
            setCurrentIndex((currentIndex - 1 + images.length) % images.length)
          }
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-1.5"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => setCurrentIndex((currentIndex + 1) % images.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-1.5"
        >
          <ChevronRight />
        </button>
      </div>
      <div className="flex gap-2 border-t-2 border-gray-200 p-2">
        {images.map((image, index) => (
          <Image
            key={index}
            src={image}
            alt={`썸네일 ${index + 1}`}
            width={64}
            height={64}
            onClick={() => setCurrentIndex(index)}
            className={
              currentIndex === index
                ? "border-3 border-teal-400 rounded-xl overflow-hidden cursor-pointer"
                : "border-3 rounded-xl overflow-hidden cursor-pointer"
            }
          />
        ))}
      </div>
    </div>
  );
}
