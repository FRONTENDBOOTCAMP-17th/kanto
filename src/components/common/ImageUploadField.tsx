"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";

interface ImageUploadFieldProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imagePreviews: string[];
  maxCount?: number;
  minCount?: number;
  isChecking?: boolean;
  onUploadClick: () => void;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onFilesDropped?: (files: File[]) => void;
}

export function ImageUploadField({
  fileInputRef,
  imagePreviews,
  maxCount = 10,
  minCount,
  isChecking = false,
  onUploadClick,
  onSelect,
  onRemove,
  onFilesDropped,
}: ImageUploadFieldProps) {
  const t = useTranslations("Common");
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!onFilesDropped) return;
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length > 0) onFilesDropped(files);
  };

  return (
    <div className="space-y-2">
      <Label>
        {minCount !== undefined
          ? t("imageUpload.labelWithMin", { minCount, maxCount })
          : t("imageUpload.label", { maxCount })}
      </Label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onSelect}
      />
      <div className="space-y-3">
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-5 gap-3">
            {imagePreviews.map((img, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={img}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={t("imageUpload.removeImage", { index: index + 1 })}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {imagePreviews.length < maxCount && (
          <button
            type="button"
            onClick={onUploadClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            disabled={isChecking}
            className={`w-full border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
              isDragging
                ? "border-teal-500 bg-teal-50"
                : "border-gray-300 hover:border-teal-500"
            }`}
          >
            <div className="flex flex-col items-center gap-2 text-gray-500">
              {isChecking ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm">{t("imageUpload.checking")}</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-8 h-8" />
                  <span className="text-sm">
                    {isDragging ? t("imageUpload.drop") : t("imageUpload.add")}
                  </span>
                  <span className="text-xs">({imagePreviews.length}/{maxCount})</span>
                </>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
