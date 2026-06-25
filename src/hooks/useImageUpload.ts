"use client";

import { useState, useRef, useEffect } from "react";
import { moderateImage } from "@/lib/moderateImage";

export function useImageUpload(initialUrls: string[] = [], maxCount = 10) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialUrls);
  const [isChecking, setIsChecking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagePreviewsRef = useRef<string[]>([]);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onBlocked?: (reason: string) => void,
  ) => {
    const files = Array.from(e.target.files ?? []);
    const candidates = files.slice(0, maxCount - imageFiles.length);
    e.target.value = "";

    setIsChecking(true);
    try {
      const passed: File[] = [];
      let reason: string | null = null;

      for (const file of candidates) {
        const outcome = await moderateImage(file);
        if (outcome.allowed) {
          passed.push(file);
        } else {
          reason = outcome.reason;
        }
      }

      if (reason) onBlocked?.(reason);
      setImageFiles((prev) => [...prev, ...passed]);
      setImagePreviews((prev) => [
        ...prev,
        ...passed.map((file) => URL.createObjectURL(file)),
      ]);
    } finally {
      setIsChecking(false);
    }
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
    isChecking,
    handleImageUpload,
    handleImageSelect,
    removeImage,
    resetImages,
  };
}
