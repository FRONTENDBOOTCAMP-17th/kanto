"use client";

import { useState } from "react";
import { toggleLike } from "@/services/likeToggle";

interface UseJobLikeParams {
  id: number;
  currentUserId: number | null;
  initialIsLiked: boolean;
  onLoginRequired: () => void;
}

export function useJobLike({ id, currentUserId, initialIsLiked, onLoginRequired }: UseJobLikeParams) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);

  const handleLike = async () => {
    if (currentUserId === null) {
      onLoginRequired();
      return;
    }
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);

    const { error } = await toggleLike(id, currentUserId, wasLiked);

    if (error) setIsLiked(wasLiked);
  };

  return { isLiked, handleLike };
}
