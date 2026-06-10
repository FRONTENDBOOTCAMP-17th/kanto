"use client";

import { useState, useEffect } from "react";
import { toggleLike } from "@/services/likeToggle";

interface UseJobLikeParams {
  id: number;
  currentUserId: number | null;
  initialIsLiked: boolean;
  onLoginRequired: () => void;
}

const LIKE_EVENT = "job-like-toggle";

export function useJobLike({ id, currentUserId, initialIsLiked, onLoginRequired }: UseJobLikeParams) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);

  useEffect(() => {
    const handler = (e: Event) => {
      const { postId, liked } = (e as CustomEvent<{ postId: number; liked: boolean }>).detail;
      if (postId === id) setIsLiked(liked);
    };
    window.addEventListener(LIKE_EVENT, handler);
    return () => window.removeEventListener(LIKE_EVENT, handler);
  }, [id]);

  const handleLike = async () => {
    if (currentUserId === null) {
      onLoginRequired();
      return;
    }
    const wasLiked = isLiked;
    const nextLiked = !wasLiked;
    setIsLiked(nextLiked);
    window.dispatchEvent(new CustomEvent(LIKE_EVENT, { detail: { postId: id, liked: nextLiked } }));

    const { error } = await toggleLike(id, currentUserId, wasLiked);

    if (error) {
      setIsLiked(wasLiked);
      window.dispatchEvent(new CustomEvent(LIKE_EVENT, { detail: { postId: id, liked: wasLiked } }));
    }
  };

  return { isLiked, handleLike };
}
