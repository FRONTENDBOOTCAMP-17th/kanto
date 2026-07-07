"use client";

import Image from "next/image";
import type { ImageProps } from "next/image";
import { useState } from "react";

export function ImageWithFallback({
  src,
  alt = "",
  onError,
  ...rest
}: ImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  const imgSrc = failedSrc === src ? "/fallback-image.svg" : src;

  return (
    <Image
      {...rest}
      src={imgSrc}
      alt={alt}
      // Supabase 원본이 업로드 시점에 이미 WebP+리사이즈로 최적화되어 있어,
      // Vercel 이미지 최적화(/_next/image)를 우회한다. Vercel 최적화 한도 초과로
      // 발생하던 402(OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED)를 방지한다.
      unoptimized
      onError={(e) => {
        setFailedSrc(src);
        onError?.(e);
      }}
    />
  );
}
