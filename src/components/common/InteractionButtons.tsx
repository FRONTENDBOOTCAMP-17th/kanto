"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, Share2, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLike } from "@/services/likeToggle";
import { useAuthStore } from "@/store/authStore";
import Toast from "@/components/common/Toast";
import ReportModal from "@/components/common/ReportModal";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";

interface InteractionButtonsProps {
  postId: number;
  userId: number | undefined;
  initialLiked: boolean;
  initialReported: boolean;
  onLikeChange?: (liked: boolean) => void;
  size?: "sm" | "lg";
  className?: string;
}

export default function InteractionButtons({
  postId,
  userId,
  initialLiked,
  initialReported,
  onLikeChange,
  size = "lg",
  className = "",
}: InteractionButtonsProps) {
  const t = useTranslations("Common");
  const { user: storeUser } = useAuthStore();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLike = async () => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }
    if (storeUser?.deleted_at) {
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

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setToastMessage(`${t("urlCopied")}\n${url}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        <Button
          size={size}
          aria-label={isLiked ? t("unlike") : t("like")}
          aria-pressed={isLiked}
          onClick={handleLike}
          className="cursor-pointer border rounded-lg bg-white hover:bg-black/10 border-gray-200"
        >
          <Heart className={isLiked ? "fill-red-400 text-red-400" : "text-black"} />
        </Button>
        <Button
          size={size}
          aria-label={t("share")}
          onClick={handleShare}
          className="cursor-pointer border rounded-lg bg-white hover:bg-black/10 border-gray-200"
        >
          <Share2 className="text-black" />
        </Button>
        <Button
          size={size}
          aria-label={t("report")}
          onClick={() => setShowReportModal(true)}
          className="cursor-pointer border rounded-lg bg-white hover:bg-red-300/50 border-gray-200"
        >
          <Siren className="text-black" />
        </Button>
      </div>
      <Toast message={toastMessage} showMessage={showToast} />
      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={postId}
        userId={userId}
        initialReported={initialReported}
      />
    </>
  );
}
