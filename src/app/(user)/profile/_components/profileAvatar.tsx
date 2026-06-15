"use client";

import Image from "next/image";
import { User, Camera } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

export default function ProfileAvatar({
  avatarUrl,
  name,
  onFileChange,
}: {
  avatarUrl: string | null;
  name: string | null;
  onFileChange: (file: File) => void;
}) {
  const { fileInputRef, imagePreviews, handleImageUpload, handleImageSelect } = useImageUpload([], 1);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleImageSelect(e);
    if (file) onFileChange(file);
  };

  const previewUrl = imagePreviews[0] ?? avatarUrl;

  return (
    <div className="flex flex-col items-center px-5 pt-7 pb-6">
      <div className="relative w-20 h-20">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={name ?? "프로필"}
            sizes="80px"
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 bg-linear-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-md">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSelect}
        />
        <button
          type="button"
          aria-label="프로필 사진 변경"
          onClick={handleImageUpload}
          className="cursor-pointer absolute bottom-0 right-0 w-6 h-6 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center"
        >
          <Camera className="w-3 h-3 text-white" />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2.5">사진을 클릭하여 변경</p>
    </div>
  );
}
