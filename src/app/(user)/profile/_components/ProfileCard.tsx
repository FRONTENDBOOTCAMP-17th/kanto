"use client";

import { useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import type { User as UserType } from "@/type/user";
import ProfileAvatar from "./profileAvatar";
import { ProfileAside, ProfileMobileTabs, type Tab } from "./ProfileAside";
import { ProfileInfoSection } from "./sections/ProfileInfoSection";
import { ProfileReviewsSection } from "./sections/ProfileReviewsSection";
import { ProfileAlertsSection } from "./sections/ProfileAlertsSection";
import type { AlertSettings } from "@/hooks/profile/useAlertSettings";
import { ProfileBlockedSection } from "./sections/ProfileBlockedSection";
import { ProfileSettingsSection } from "./sections/ProfileSettingsSection";
import type { UserIdentity } from "@supabase/supabase-js";
import type { ReviewWithReviewer } from "@/type/review";

const PROVIDER_KEYS = ["google", "kakao", "facebook"] as const;

export function ProfileCard({ alertSettings, initialIdentities, reviews }: { alertSettings: AlertSettings; initialIdentities: UserIdentity[]; reviews: ReviewWithReviewer[] }) {
  const { user } = useAuthStore();
  if (!user) return null;
  return <ProfileForm user={user} alertSettings={alertSettings} initialIdentities={initialIdentities} reviews={reviews} />;
}

function ProfileForm({ user, alertSettings, initialIdentities, reviews }: { user: UserType; alertSettings: AlertSettings; initialIdentities: UserIdentity[]; reviews: ReviewWithReviewer[] }) {
import { IdentityVerificationModal } from "./IdentityVerificationModal";

const PROVIDER_KEYS = ["google", "kakao", "facebook", "email"] as const;

export function ProfileCard({
  alertSettings,
  initialIdentities,
  initialIsVerified,
}: {
  alertSettings: AlertSettings;
  initialIdentities: UserIdentity[];
  initialIsVerified: boolean;
}) {
  const { user } = useAuthStore();
  if (!user) return null;
  return (
    <ProfileForm
      user={user}
      alertSettings={alertSettings}
      initialIdentities={initialIdentities}
      initialIsVerified={initialIsVerified}
    />
  );
}

function ProfileForm({
  user,
  alertSettings,
  initialIdentities,
  initialIsVerified,
}: {
  user: UserType;
  alertSettings: AlertSettings;
  initialIdentities: UserIdentity[];
  initialIsVerified: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(initialIsVerified);
  const router = useRouter();
  const t = useTranslations("Profile.card");
  const tp = useTranslations("Profile.providers");
  const tt = useTranslations("Time");

  const providerKey = PROVIDER_KEYS.find((p) => p === user.provider) ?? "email";
  const joinedAt = user.created_at ? new Date(user.created_at) : null;

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  return (
    <div className="bg-white md:bg-gray-50 min-h-screen md:min-h-0 md:rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label={t("back")}
          className="cursor-pointer p-1 -ml-1"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">{t("title")}</h1>
      </div>

      <div className="md:flex md:p-8 p-0 bg-white md:rounded-xl md:border md:border-gray-100">
        <ProfileAside activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 사이드바 — 프로필 정보 */}
        <div className="md:w-64 md:shrink-0 flex flex-col gap-6 md:border-r md:border-gray-100 md:px-8">
          <ProfileMobileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div
            className={`flex flex-col gap-6 ${activeTab !== "info" ? "hidden md:flex" : ""}`}
          >
            <ProfileAvatar
              avatarUrl={user.avatar_url ?? ""}
              name={user.name ?? ""}
              onFileChange={setAvatarFile}
            />
            <div className="-mt-4 text-center">
              <p className="font-semibold text-gray-900">{user.name ?? ""}</p>
              <p className="text-sm text-gray-400 mt-0.5">{user.email ?? ""}</p>
            </div>

            <div className="border-t border-gray-100" />

            {/* 활동 통계 */}
            <div className="flex flex-col gap-3 px-5 md:px-0">
              <h2 className="text-sm font-semibold text-gray-700">
                {t("stats")}
              </h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-gray-900">
                    {user.post_count ?? 0}
                  </span>
                  <span className="text-xs text-gray-500">{t("posts")}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-gray-900">0</span>
                  <span className="text-xs text-gray-500">
                    {t("favorites")}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-gray-900">{reviewCount}</span>
                  <span className="text-xs text-gray-500">{t("reviews")}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* 계정 정보 */}
            <div className="flex flex-col gap-3 px-5 md:px-0">
              <h2 className="text-sm font-semibold text-gray-700">
                {t("account")}
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{t("joinedAt")}</span>
                <span className="text-sm text-gray-700">
                  {joinedAt
                    ? tt("joinedYearMonth", {
                        year: joinedAt.getFullYear(),
                        month: joinedAt.getMonth() + 1,
                      })
                    : tt("joinDateUnknown")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{t("provider")}</span>
                <span className="text-sm text-gray-700">{tp(providerKey)}</span>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* 본인인증 */}
            <div className="flex flex-col gap-3 px-5 md:px-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <h2 className="text-sm font-semibold text-gray-700">
                  {t("verify")}
                </h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {isIdentityVerified
                  ? "본인인증이 완료되었습니다."
                  : "게시물 작성과 랜덤채팅 참여는 인증이 필요합니다."}
              </p>
              <button
                type="button"
                onClick={() => setIsVerificationOpen(true)}
                disabled={isIdentityVerified}
                className="cursor-pointer w-full py-2.5 rounded-lg border border-teal-500 text-teal-500 text-sm font-medium bg-transparent hover:bg-teal-50 transition-colors disabled:cursor-default disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
              >
                {isIdentityVerified ? "인증 완료" : "본인인증 하기"}
              </button>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 md:pl-8">
          {activeTab === "info" && <ProfileInfoSection user={user} avatarFile={avatarFile} />}
          {activeTab === "reviews" && <ProfileReviewsSection reviews={reviews} avgRating={avgRating} reviewCount={reviewCount} />}
          {activeTab === "alerts" && <ProfileAlertsSection initialSettings={alertSettings} />}
          {activeTab === "blocked" && <ProfileBlockedSection />}
          {activeTab === "settings" && (
            <ProfileSettingsSection initialIdentities={initialIdentities} />
          )}
        </div>
      </div>
      {isVerificationOpen && (
        <IdentityVerificationModal
          isOpen={isVerificationOpen}
          defaultName=""
          defaultEmail=""
          onClose={() => setIsVerificationOpen(false)}
          onVerified={() => setIsIdentityVerified(true)}
        />
      )}
    </div>
  );
}
