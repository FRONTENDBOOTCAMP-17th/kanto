"use client";

import { useState } from "react";
import { ArrowLeft, User, Camera, ShieldCheck } from "lucide-react";
import type { ProfileCardProps } from "@/type/profile";
import { ProfileField } from "@/app/(user)/profile/_components/ProfileField";

export function ProfileCard({ user, onBack, onLogout }: ProfileCardProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState("+63 917 123 4567");
  const [location, setLocation] = useState("Makati, Manila");

  const handleSave = () => {};
  const handleDeleteAccount = () => {};

  if (!user) return null;

  return (
    <div className="bg-white pb-10 rounded-2xl md:border md:border-gray-100">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-0">
        <button onClick={onBack} aria-label="뒤로 가기" className="cursor-pointer p-1 -ml-1">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <span className="text-base font-medium text-gray-900">내 프로필</span>
      </div>

      {/* 아바타 섹션 */}
      <div className="flex flex-col items-center px-5 pt-7 pb-6">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center">
            <User className="w-9 h-9 text-teal-500" />
          </div>
          <button aria-label="프로필 사진 변경" className="cursor-pointer absolute bottom-0 right-0 w-6 h-6 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center">
            <Camera className="w-3 h-3 text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2.5">사진을 클릭하여 변경</p>
      </div>

      {/* 폼 필드 + 저장 버튼 */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        className="px-5 flex flex-col gap-4"
      >
        <ProfileField
          label="이름"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 text-sm text-gray-900 border border-teal-500 rounded-lg outline-none focus:ring-2 focus:ring-teal-200"
        />

        <ProfileField
          label="이메일"
          type="email"
          value={user.email}
          disabled
          hint="이메일은 변경할 수 없습니다"
        />

        <ProfileField
          label="전화번호"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <ProfileField
          label="지역"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <button
          type="submit"
          className="cursor-pointer w-full py-3.5 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors mt-3"
        >
          저장하기
        </button>
      </form>

      <div className="border-t border-gray-100 my-7" />

      {/* 본인인증 섹션 */}
      <div className="px-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-500" />
          <span className="text-base font-medium text-gray-900">본인인증</span>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          게시물 작성과 랜덤채팅 참여는 인증이 필요합니다.
        </p>
        <button className="cursor-pointer w-full py-3 rounded-lg border border-teal-500 text-teal-500 text-sm font-medium bg-transparent hover:bg-teal-50 transition-colors">
          본인인증 하기
        </button>
      </div>

      <div className="border-t border-gray-100 my-7" />

      {/* 로그아웃 / 회원탈퇴 */}
      <div className="px-5 flex flex-col gap-3">
        <button
          onClick={onLogout}
          className="cursor-pointer w-full py-3 rounded-lg border border-gray-200 text-red-500 text-sm font-medium bg-transparent hover:bg-gray-100 transition-colors"
        >
          로그아웃
        </button>
        <button
          onClick={handleDeleteAccount}
          className="cursor-pointer w-full py-3 rounded-lg border border-red-200 text-red-500 hover:text-white text-sm font-medium bg-transparent hover:bg-rose-600 transition-colors"
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}