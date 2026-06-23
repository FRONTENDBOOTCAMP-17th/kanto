"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import ReportModal, {
  USER_REPORT_CATEGORIES,
} from "@/components/common/ReportModal";
import { blockUserStandaloneAction } from "@/services/user/blockUser";
import { ProfileReviewsSection } from "@/app/(user)/profile/_components/sections/ProfileReviewsSection";
import type { ReviewWithReviewer } from "@/type/review";
import type { PublicProfile } from "@/services/user/publicProfile";
import { PublicProfileCard } from "./PublicProfileCard";

interface Props {
  profile: PublicProfile;
  reviews: ReviewWithReviewer[];
  currentUserId: number | null;
  initialBlocked: boolean;
}

export function PublicProfileView({
  profile,
  reviews,
  currentUserId,
  initialBlocked,
}: Props) {
  const t = useTranslations("PublicProfile");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blocked, setBlocked] = useState(initialBlocked);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false));

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      await blockUserStandaloneAction(profile.id);
      setBlocked(true);
    } finally {
      setIsBlocking(false);
      setShowBlockConfirm(false);
    }
  };

  return (
    <div className="bg-white md:rounded-xl md:border md:border-gray-100 overflow-hidden min-h-screen md:min-h-0">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          aria-label={tc("close")}
          className="p-1 -ml-1 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="flex-1 text-base font-semibold text-gray-900">
          {t("title")}
        </h1>

        {currentUserId !== null && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((p) => !p)}
              aria-label={t("moreMenu")}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-5 h-5 text-gray-700" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-36 z-20">
                <button
                  onClick={() => {
                    setShowReport(true);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                >
                  {t("report")}
                </button>
                <button
                  onClick={() => {
                    setShowBlockConfirm(true);
                    setMenuOpen(false);
                  }}
                  disabled={blocked}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100 disabled:text-gray-400 disabled:hover:bg-white"
                >
                  {blocked ? t("blocked") : t("block")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <PublicProfileCard profile={profile} reviewCount={reviewCount} />

      <div className="border-t border-gray-100" />

      <ProfileReviewsSection
        reviews={reviews}
        avgRating={avgRating}
        reviewCount={reviewCount}
      />

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        postId={profile.id}
        userId={currentUserId ?? undefined}
        initialReported={false}
        categories={USER_REPORT_CATEGORIES}
        targetType="user"
      />

      {showBlockConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowBlockConfirm(false)}
        >
          <div
            className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-semibold text-gray-800">
              {t("blockConfirmMessage", { name: profile.name })}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={handleBlock}
                disabled={isBlocking}
                className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {tc("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
