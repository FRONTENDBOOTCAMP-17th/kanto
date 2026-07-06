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
      onError={(e) => {
        setFailedSrc(src);
        onError?.(e);
      }}
    />
  );
}
