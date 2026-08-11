"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { ProfileAside, ProfileMobileTabs, TAB_KEYS, type Tab } from "./ProfileAside";
import { ProfileSidebar } from "./ProfileSidebar";
import { ProfileInfoSection } from "./sections/ProfileInfoSection";
import { ProfileReviewsSection } from "./sections/ProfileReviewsSection";
import { ProfileAlertsSection } from "./sections/ProfileAlertsSection";
import { ProfileBlockedSection } from "./sections/ProfileBlockedSection";
import { ProfileSettingsSection } from "./sections/ProfileSettingsSection";
import { ProfilePaymentSection } from "./sections/ProfilePaymentSection";
import { ProfileTransactionsSection } from "./sections/ProfileTransactionsSection";
import { ProfileMeetingsSection } from "./sections/ProfileMeetingsSection";
import { IdentityVerificationModal } from "./IdentityVerificationModal";
import type { ProfileOverviewData } from "@/services/profile/profileOverview";

export function ProfileCard({
  overview,
  initialTab,
}: {
  overview: ProfileOverviewData;
  initialTab?: string;
}) {
  const { user } = useAuthStore();
  const {
    alertSettings,
    identities: initialIdentities,
    reviews,
    initialIsVerified,
    postCount,
    likeCount,
    createdMeetups,
    joinedMeetups,
  } = overview;

  const [activeTab, setActiveTab] = useState<Tab>(
    TAB_KEYS.includes(initialTab as Tab) ? (initialTab as Tab) : "info"
  );
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(initialIsVerified);
  const router = useRouter();
  const t = useTranslations("Profile.card");

  if (!user) return null;

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  const tabContent: Record<Tab, React.ReactNode> = {
    info: <ProfileInfoSection user={user} />,
    payment: <ProfilePaymentSection user={user} />,
    history: <ProfileTransactionsSection />,
    reviews: <ProfileReviewsSection reviews={reviews} avgRating={avgRating} reviewCount={reviewCount} />,
    meetings: <ProfileMeetingsSection createdMeetups={createdMeetups} joinedMeetups={joinedMeetups} />,
    alerts: <ProfileAlertsSection initialSettings={alertSettings} />,
    blocked: <ProfileBlockedSection />,
    settings: <ProfileSettingsSection initialIdentities={initialIdentities} />,
  };

  return (
    <div className="bg-white md:bg-gray-50 min-h-screen md:min-h-0 md:rounded-xl overflow-hidden">

      <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label={t("back")}
          className="cursor-pointer p-1 -ml-1"
        >
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">{t("title")}</h1>
      </div>

      <div className="md:flex md:p-8 p-0 bg-white md:rounded-b-xl">
        <ProfileAside activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="md:w-64 md:shrink-0 flex flex-col gap-6 md:border-r md:border-gray-100 md:px-8">
          <ProfileMobileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <ProfileSidebar
            user={user}
            activeTab={activeTab}
            postCount={postCount}
            likeCount={likeCount}
            reviewCount={reviewCount}
            onReviewsClick={() => setActiveTab("reviews")}
            isIdentityVerified={isIdentityVerified}
            onVerify={() => setIsVerificationOpen(true)}
          />
        </div>

        <div className="flex-1 md:pl-8">{tabContent[activeTab]}</div>
      </div>

      {isVerificationOpen && (
        <IdentityVerificationModal
          isOpen={isVerificationOpen}
          defaultName=""
          defaultEmail=""
          onClose={() => setIsVerificationOpen(false)}
          onVerified={() => {
            setIsIdentityVerified(true);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
