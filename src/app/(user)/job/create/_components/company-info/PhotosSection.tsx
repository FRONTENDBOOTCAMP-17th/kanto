"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import { useImageUpload } from "@/hooks/useImageUpload";
import Toast from "@/components/common/Toast";

interface PhotosSectionProps {
  imageUpload: ReturnType<typeof useImageUpload>;
}

export function PhotosSection({ imageUpload }: PhotosSectionProps) {
  const t = useTranslations("Job");
  const tc = useTranslations("Common");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImageSelectWithToast = (e: React.ChangeEvent<HTMLInputElement>) =>
    imageUpload.handleImageSelect(e, (reason) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToastMessage(
        reason === "unavailable" ? tc("imageUpload.unavailable") : tc("imageUpload.blocked"),
      );
      setShowToast(true);
      toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
    });

  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-4">
        {t("form.photos")} <span className="text-gray-400 font-normal text-sm">{t("form.optional")}</span>
      </h2>
      <ImageUploadField
        fileInputRef={imageUpload.fileInputRef}
        imagePreviews={imageUpload.imagePreviews}
        isChecking={imageUpload.isChecking}
        onUploadClick={imageUpload.handleImageUpload}
        onSelect={handleImageSelectWithToast}
        onRemove={imageUpload.removeImage}
        onReorder={imageUpload.reorderImages}
      />
      <Toast message={toastMessage} showMessage={showToast} type="error" icon="alert" />
    </div>
  );
}
