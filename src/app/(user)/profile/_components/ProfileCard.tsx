"use client";

import { useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import type { User as UserType } from "@/type/user";
import ProfileAvatar from "./profileAvatar";
import { ProfileAside, ProfileMobileTabs, type Tab } from "./ProfileAside";
import { ProfileInfoSection } from "./sections/ProfileInfoSection";
import { ProfileReviewsSection } from "./sections/ProfileReviewsSection";
import { ProfileAlertsSection } from "./sections/ProfileAlertsSection";
import { ProfileBlockedSection } from "./sections/ProfileBlockedSection";
import { ProfileSettingsSection } from "./sections/ProfileSettingsSection";
import { formatSellerInfoCreatedAt } from "@/utils/formatTime";

export function ProfileCard() {
  const { user } = useAuthStore();
  if (!user) return null;
  return <ProfileForm user={user} />;
}

function ProfileForm({ user }: { user: UserType }) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const router = useRouter();

  return (
    <div className="bg-white md:bg-gray-50 min-h-screen md:min-h-0 md:rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="cursor-pointer p-1 -ml-1"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">내 프로필</h1>
      </div>

      <div className="md:flex md:p-8 p-0 bg-white md:rounded-xl md:border md:border-gray-100">
        <ProfileAside activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 사이드바 — 프로필 정보 */}
        <div className="md:w-64 md:shrink-0 flex flex-col gap-6 md:border-r md:border-gray-100 md:px-8">
          <ProfileMobileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className={`flex flex-col gap-6 ${activeTab !== "info" ? "hidden md:flex" : ""}`}>
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
              <h2 className="text-sm font-semibold text-gray-700">활동 통계</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-gray-900">{user.post_count ?? 0}</span>
                  <span className="text-xs text-gray-500">게시글</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-gray-900">0</span>
                  <span className="text-xs text-gray-500">찜 목록</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-gray-900">0</span>
                  <span className="text-xs text-gray-500">받은 후기</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* 계정 정보 */}
            <div className="flex flex-col gap-3 px-5 md:px-0">
              <h2 className="text-sm font-semibold text-gray-700">계정 정보</h2>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">가입일</span>
                <span className="text-sm text-gray-700">{formatSellerInfoCreatedAt(user.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">가입경로</span>
                <span className="text-sm text-gray-700">
                  {user.provider === "google"
                    ? "구글"
                    : user.provider === "kakao"
                      ? "카카오톡"
                      : user.provider === "facebook"
                        ? "페이스북"
                        : "이메일"}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* 본인인증 */}
            <div className="flex flex-col gap-3 px-5 md:px-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <h2 className="text-sm font-semibold text-gray-700">본인인증</h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                게시물 작성과 랜덤채팅 참여는 인증이 필요합니다.
              </p>
              <button className="cursor-pointer w-full py-2.5 rounded-lg border border-teal-500 text-teal-500 text-sm font-medium bg-transparent hover:bg-teal-50 transition-colors">
                본인인증 하기
              </button>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 md:pl-8">
          {activeTab === "info" && <ProfileInfoSection user={user} avatarFile={avatarFile} />}
          {activeTab === "reviews" && <ProfileReviewsSection />}
          {activeTab === "alerts" && <ProfileAlertsSection />}
          {activeTab === "blocked" && <ProfileBlockedSection />}
          {activeTab === "settings" && <ProfileSettingsSection />}
        </div>
      </div>
    </div>
  );
}
