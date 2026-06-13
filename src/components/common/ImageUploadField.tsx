"use client";

import { ImagePlus, X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ImageUploadFieldProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imagePreviews: string[];
  maxCount?: number;
  onUploadClick: () => void;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}

export function ImageUploadField({
  fileInputRef,
  imagePreviews,
  maxCount = 10,
  onUploadClick,
  onSelect,
  onRemove,
}: ImageUploadFieldProps) {
  return (
    <div className="space-y-2">
      <Label>사진 (최대 {maxCount}장)</Label>
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
                  aria-label={`이미지 ${index + 1} 삭제`}
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
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-teal-500 transition-colors"
          >
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <ImagePlus className="w-8 h-8" />
              <span className="text-sm">사진 추가하기</span>
              <span className="text-xs">({imagePreviews.length}/{maxCount})</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
