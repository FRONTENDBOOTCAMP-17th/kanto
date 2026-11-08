"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { toggleLike } from "@/services/likeToggle";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { useAuthStore } from "@/store/authStore";
import { useSuspended } from "@/hooks/useSuspended";
import { useMyLikedPostIds } from "@/hooks/useMyLikedPostIds";

interface LikeButtonProps {
  postId: number;
  initialIsLiked: boolean;
  // undefined면 정적 페이지에서 렌더링된 경우로, 로그인 사용자·좋아요 여부를 클라이언트에서 판별한다.
  currentUserId: number | null | undefined;
  className?: string;
  onLikeChange?: (liked: boolean) => void;
}

export function LikeButton({ postId, initialIsLiked, currentUserId, className, onLikeChange }: LikeButtonProps) {
  const t = useTranslations("Common");
  const resolveOnClient = currentUserId === undefined;
  const likedIds = useMyLikedPostIds(resolveOnClient);
  const [likedOverride, setIsLiked] = useState<boolean | null>(null);
  const isLiked = likedOverride ?? (resolveOnClient ? (likedIds?.has(postId) ?? false) : initialIsLiked);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuthStore();
  const authReady = useAuthStore((s) => s.authReady);
  const userId = resolveOnClient ? (user?.id ?? null) : currentUserId;
  const { isSuspended, openModal } = useSuspended();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (resolveOnClient && !authReady) return;

    if (userId === null) {
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

    const { error } = await toggleLike(postId, userId, wasLiked);
    if (error) {
      setIsLiked(wasLiked);
      onLikeChange?.(wasLiked);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`group/like cursor-pointer hover:bg-gray-100 ${className ?? ""}`}
        aria-label={isLiked ? t("unfavorite") : t("favorite")}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400 group-hover/like:text-red-500"}`}
        />
      </button>
      <LoginRequiredModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
