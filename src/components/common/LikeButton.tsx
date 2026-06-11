"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { toggleLike } from "@/services/likeToggle";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";

interface LikeButtonProps {
  postId: number;
  initialIsLiked: boolean;
  className?: string;
}

export function LikeButton({ postId, initialIsLiked, className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [showModal, setShowModal] = useState(false);
  const currentUserId = useCurrentUserId();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentUserId === null) {
      setShowModal(true);
      return;
    }

    const wasLiked = isLiked;
    setIsLiked(!wasLiked);

    const { error } = await toggleLike(postId, currentUserId, wasLiked);
    if (error) setIsLiked(wasLiked);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={className}
        aria-label={isLiked ? "찜 해제" : "찜하기"}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}`}
        />
      </button>
      <LoginRequiredModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
