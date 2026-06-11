"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "@/services/likeToggle";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";

interface LikeButtonProps {
  postId: number;
  initialIsLiked: boolean;
  currentUserId: number | null;
  className?: string;
}

export function LikeButton({ postId, initialIsLiked, currentUserId, className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [showModal, setShowModal] = useState(false);

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
        className={`group cursor-pointer hover:bg-gray-100 ${className ?? ""}`}
        aria-label={isLiked ? "찜 해제" : "찜하기"}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400 group-hover:text-red-500"}`}
        />
      </button>
      <LoginRequiredModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
