"use client";

import { useState } from "react";
import Image from "next/image";
import { User, Camera, Check, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuthStore } from "@/store/authStore";
import { uploadAvatar, updateAvatarUrl } from "@/services/profile/profileInfo";

export default function ProfileAvatar({
  avatarUrl,
  name,
  userId,
}: {
  avatarUrl: string | null;
  name: string | null;
  userId: number;
}) {
  const t = useTranslations("Profile.avatar");
  const { setUser } = useAuthStore();
  const { fileInputRef, imageFiles, imagePreviews, handleImageUpload, handleImageSelect, resetImages } =
    useImageUpload([], 1);
  const [saving, setSaving] = useState(false);

  const hasPending = imagePreviews.length > 0;
  const previewUrl = imagePreviews[0] ?? avatarUrl;

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleImageSelect(e);
  };

  const handleConfirm = async () => {
    const file = imageFiles[0];
    if (!file) return;
    setSaving(true);
    try {
      const url = await uploadAvatar(userId, file);
      const updated = await updateAvatarUrl(userId, url);
      setUser(updated);
      resetImages();
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    resetImages();
  };

  return (
    <div className="flex flex-col items-center px-5 pt-7 pb-6">
      <div
        className={`relative w-20 h-20 ${!hasPending && !saving ? "cursor-pointer" : ""}`}
        onClick={!hasPending && !saving ? handleImageUpload : undefined}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={name ?? t("alt")}
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
        {!hasPending && (
          <div className="pointer-events-none absolute bottom-0 right-0 w-6 h-6 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center">
            <Camera className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {hasPending ? (
        <div className="flex gap-3 mt-3">
          <button
            type="button"
            onClick={handleRevert}
            disabled={saving}
            aria-label="되돌리기"
            className="cursor-pointer w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            aria-label="저장"
            className="cursor-pointer w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-2.5">{t("changeHint")}</p>
      )}
    </div>
  );
}
