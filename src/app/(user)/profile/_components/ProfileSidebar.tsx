"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import ProfileAvatar from "./profileAvatar";
import { ProfileUserInfo } from "./ProfileUserInfo";
import { ProfileAccountInfo } from "./ProfileAccountInfo";
import { IdentityVerificationTrigger } from "./IdentityVerificationTrigger";
import type { Tab } from "./ProfileAside";
import type { User as UserType } from "@/type/user";

export function ProfileSidebar({
  user,
  activeTab,
  postCount,
  likeCount,
  reviewCount,
  onReviewsClick,
  isIdentityVerified,
  onVerify,
}: {
  user: UserType;
  activeTab: Tab;
  postCount: number;
  likeCount: number;
  reviewCount: number;
  onReviewsClick: () => void;
  isIdentityVerified: boolean;
  onVerify: () => void;
}) {
  const t = useTranslations("Profile.card");

  return (
    <div className={`flex flex-col gap-6 ${activeTab !== "info" ? "hidden md:flex" : ""}`}>
      <ProfileAvatar
        avatarUrl={user.avatar_url ?? ""}
        name={user.name ?? ""}
        userId={user.id}
      />
      <div className="-mt-4">
        <ProfileUserInfo name={user.name ?? ""} email={user.email ?? ""} />
      </div>

      <div className="border-t border-gray-100" />

      <div className="flex flex-col gap-3 px-5 md:px-0">
        <h2 className="text-sm font-semibold text-gray-700">{t("stats")}</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Link href="/myposts" className="flex flex-col gap-0.5 rounded-lg p-1 hover:bg-gray-50 transition-colors">
            <span className="text-xl font-bold text-gray-900">{postCount}</span>
            <span className="text-xs text-gray-500">{t("posts")}</span>
          </Link>
          <Link href="/favorites" className="flex flex-col gap-0.5 rounded-lg p-1 hover:bg-gray-50 transition-colors">
            <span className="text-xl font-bold text-gray-900">{likeCount}</span>
            <span className="text-xs text-gray-500">{t("favorites")}</span>
          </Link>
          <button
            type="button"
            onClick={onReviewsClick}
            className="flex flex-col gap-0.5 rounded-lg p-1 hover:bg-gray-50 transition-colors w-full cursor-pointer"
          >
            <span className="text-xl font-bold text-gray-900 w-full">{reviewCount}</span>
            <span className="text-xs text-gray-500">{t("reviews")}</span>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      <ProfileAccountInfo provider={user.provider ?? null} createdAt={user.created_at ?? null} />

      <div className="border-t border-gray-100" />

      <IdentityVerificationTrigger isVerified={isIdentityVerified} onVerify={onVerify} />
    </div>
  );
}
