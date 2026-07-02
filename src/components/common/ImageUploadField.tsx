"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";

interface ImageUploadFieldProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imagePreviews: string[];
  maxCount?: number;
  minCount?: number;
  required?: boolean;
  isChecking?: boolean;
  onUploadClick: () => void;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onFilesDropped?: (files: File[]) => void;
  onReorder?: (from: number, to: number) => void;
}

export function ImageUploadField({
  fileInputRef,
  imagePreviews,
  maxCount = 10,
  minCount,
  required = false,
  isChecking = false,
  onUploadClick,
  onSelect,
  onRemove,
  onFilesDropped,
  onReorder,
}: ImageUploadFieldProps) {
  const t = useTranslations("Common");
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const canReorder = Boolean(onReorder) && imagePreviews.length > 1;

  const handleThumbPointerDown = (e: React.PointerEvent, index: number) => {
    if (!canReorder || e.button !== 0) return;
    e.preventDefault();
    setDragIndex(index);
    setOverIndex(index);
    gridRef.current?.setPointerCapture(e.pointerId);
  };

  const handleGridPointerMove = (e: React.PointerEvent) => {
    if (dragIndex === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const thumb = el?.closest<HTMLElement>("[data-thumb-index]");
    if (thumb?.dataset.thumbIndex != null) {
      const idx = Number(thumb.dataset.thumbIndex);
      if (!Number.isNaN(idx) && idx !== overIndex) setOverIndex(idx);
    }
  };

  const endDrag = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      onReorder?.(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

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
    const remaining = maxCount - imagePreviews.length;
    const files = Array.from(e.dataTransfer.files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);
    if (files.length > 0) onFilesDropped(files);
  };

  return (
    <div className="space-y-2">
      <Label>
        {minCount !== undefined
          ? t("imageUpload.labelWithMin", { minCount, maxCount })
          : t("imageUpload.label", { maxCount })}
        {required && " *"}
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
          <div
            ref={gridRef}
            className="grid grid-cols-5 gap-3"
            onPointerMove={handleGridPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {imagePreviews.map((img, index) => (
              <div
                key={index}
                data-thumb-index={index}
                onPointerDown={(e) => handleThumbPointerDown(e, index)}
                onDragStart={(e) => e.preventDefault()}
                className={`relative aspect-square rounded-lg transition-opacity select-none ${
                  canReorder ? "cursor-grab touch-none active:cursor-grabbing" : ""
                } ${dragIndex === index ? "opacity-40" : ""} ${
                  dragIndex !== null && overIndex === index && dragIndex !== index
                    ? "ring-2 ring-teal-500"
                    : ""
                }`}
              >
                <img
                  src={img}
                  alt={`Upload ${index + 1}`}
                  draggable={false}
                  className="w-full h-full object-cover rounded-lg select-none pointer-events-none"
                />
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-teal-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {t("imageUpload.representative")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  onPointerDown={(e) => e.stopPropagation()}
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
