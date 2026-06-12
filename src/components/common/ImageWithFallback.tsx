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
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...rest}
      src={imgSrc}
      alt={alt}
      loading="eager"
      onError={(e) => {
        setImgSrc("/fallback-image.svg");
        onError?.(e);
      }}
    />
  );
}
