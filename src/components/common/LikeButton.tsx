"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { toggleLike } from "@/services/likeToggle";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { useAuthStore } from "@/store/authStore";
import { useSuspended } from "@/hooks/useSuspended";

interface LikeButtonProps {
  postId: number;
  initialIsLiked: boolean;
  currentUserId: number | null;
  className?: string;
  onLikeChange?: (liked: boolean) => void;
}

export function LikeButton({ postId, initialIsLiked, currentUserId, className, onLikeChange }: LikeButtonProps) {
  const t = useTranslations("Common");
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuthStore();
  const { isSuspended, openModal } = useSuspended();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentUserId === null) {
      setShowModal(true);
      return;
    }

    if (isSuspended) {
      openModal();
      return;
    }

    if (user?.deleted_at) {
      alert(t("deletedAccount.favorite"));
      return;
    }

    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    onLikeChange?.(!wasLiked);

    const { error } = await toggleLike(postId, currentUserId, wasLiked);
    if (error) {
      setIsLiked(wasLiked);
      onLikeChange?.(wasLiked);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`group cursor-pointer hover:bg-gray-100 ${className ?? ""}`}
        aria-label={isLiked ? t("unfavorite") : t("favorite")}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400 group-hover:text-red-500"}`}
        />
      </button>
      <LoginRequiredModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
