"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, Share2, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLike } from "@/services/likeToggle";
import { useAuthStore } from "@/store/authStore";
import { useSuspended } from "@/hooks/useSuspended";
import Toast from "@/components/common/Toast";
import ReportModal, { POST_REPORT_CATEGORIES } from "@/components/common/ReportModal";
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
  const tr = useTranslations("Report");
  const { user: storeUser } = useAuthStore();
  const { isSuspended, openModal } = useSuspended();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isReported, setIsReported] = useState(initialReported);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastIcon, setToastIcon] = useState<"check" | "x" | "alert">("check");
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBottomToast = (
    message: string,
    type: "success" | "error" = "success",
    icon: "check" | "x" | "alert" = type === "error" ? "alert" : "check",
  ) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setToastType(type);
    setToastIcon(icon);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
  };

  const handleLike = async () => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }
    if (isSuspended) {
      openModal();
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
    await navigator.clipboard.writeText(window.location.href);
    showBottomToast(t("urlCopied"), "success", "check");
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
          onClick={() => {
            if (!userId) { setShowLoginModal(true); return; }
            if (isSuspended) { openModal(); return; }
            if (isReported) {
              showBottomToast(
                tr("already", { target: tr("targetNoun.post") }),
                "error",
                "x",
              );
              return;
            }
            setShowReportModal(true);
          }}
          className="cursor-pointer border rounded-lg bg-white hover:bg-red-300/50 border-gray-200"
        >
          <Siren className="text-black" />
        </Button>
      </div>
      <Toast message={toastMessage} showMessage={showToast} type={toastType} icon={toastIcon} />
      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={postId}
        userId={userId}
        initialReported={initialReported}
        categories={POST_REPORT_CATEGORIES}
        targetType="post"
        onReported={() => setIsReported(true)}
        onToast={showBottomToast}
      />
    </>
  );
}
