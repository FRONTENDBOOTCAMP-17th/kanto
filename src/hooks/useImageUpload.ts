"use client";

import { useState, useRef, useEffect } from "react";

export function useImageUpload(maxCount = 10) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const allowed = files.slice(0, maxCount - imageFiles.length);

    setImageFiles((prev) => [...prev, ...allowed]);
    setImagePreviews((prev) => [
      ...prev,
      ...allowed.map((file) => URL.createObjectURL(file)),
    ]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
  };

  return {
    imageFiles,
    imagePreviews,
    fileInputRef,
    handleImageUpload,
    handleImageSelect,
    removeImage,
    resetImages,
  };
}
