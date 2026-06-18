"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { LikeButton } from "@/components/common/LikeButton";
import { formatTimeAgo, formatDeadline } from "@/utils/formatTime";

interface JobCardProps {
  id: number;
  title: string;
  companyName: string;
  salary: number;
  salaryType: string | null;
  locationText: string;
  createdAt: string;
  deadline: string;
  employeeType: string;
  workHours: string;
  initialIsLiked: boolean;
  currentUserId: number | null;
}

export function JobCard({
  id,
  title,
  companyName,
  salary,
  salaryType,
  locationText,
  createdAt,
  deadline,
  employeeType,
  workHours,
  initialIsLiked,
  currentUserId,
}: JobCardProps) {
  const te = useTranslations("Enums");
  const router = useRouter();

  const dDay = formatDeadline(deadline);
  const dDayClass =
    dDay === "오늘 마감" ? "bg-red-50 text-red-400" : "bg-gray-100 text-gray-400";

  const employeeTypeClass =
    employeeType === "정규직"
      ? "bg-blue-50 text-blue-600"
      : employeeType === "계약직"
        ? "bg-amber-50 text-amber-600"
        : employeeType === "파트타임"
          ? "bg-green-50 text-green-600"
          : "bg-gray-100 text-gray-600";

  const dDayBadge = (
    <span className={`rounded px-1.5 py-0.5 font-medium ${dDayClass}`}>{dDay}</span>
  );

  return (
    <div
      className="bg-white px-5 py-4 flex justify-between gap-3 md:gap-4 hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={() => router.push(`/job/${id}`)}
    >
      {/* 모바일: 기존 세로 스택 */}
      <div className="flex flex-col gap-2 flex-1 min-w-0 md:hidden">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 text-lg truncate transition-colors">
              {title}
            </p>
            <span className={`shrink-0 text-sm rounded px-1.5 py-0.5 font-medium ${employeeTypeClass}`}>
              {employeeType}
            </span>
          </div>
          <p className="text-base text-gray-500 mt-0.5">{companyName}</p>
        </div>

        <p className="text-sm text-gray-500">{workHours}</p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-medium text-gray-800">
            {salary.toLocaleString()}
            {salaryType && <span className="text-gray-400 font-normal ml-1">/ {te(`salaryType.${salaryType}`)}</span>}
          </span>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>{locationText}</span>
          </div>
        </div>
      </div>

      {/* 데스크탑: 4단 가로 (회사 / 제목 / 급여·위치 / 근무시간) */}
      <div className="hidden md:flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-2 min-w-0">
          <p className="text-sm lg:text-base font-bold text-gray-700 truncate">{companyName}</p>
        </div>

        <div className="flex items-center gap-2 flex-4 min-w-0 border-l px-4 self-stretch">
          <p className="font-semibold text-gray-900 text-base lg:text-lg truncate transition-colors">
            {title}
          </p>
          <span className={`shrink-0 text-xs lg:text-sm rounded px-1.5 py-0.5 font-medium ${employeeTypeClass}`}>
            {employeeType}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 flex-3 min-w-0">
          <span className="text-sm lg:text-base font-medium text-gray-800">
            {salary.toLocaleString()}
            {salaryType && <span className="text-gray-400 font-normal ml-1">/ {te(`salaryType.${salaryType}`)}</span>}
          </span>
          <div className="flex items-center gap-1 text-xs lg:text-sm text-gray-500 min-w-0">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>
        </div>

        <div className="flex-2 min-w-0">
          <p className="text-xs lg:text-sm text-gray-600 line-clamp-2">{workHours}</p>
        </div>
      </div>

      {/* 우측: 찜 버튼 (데스크탑은 그 아래로 마감 배지·등록 시간) */}
      <div className="shrink-0 md:w-24 flex flex-col items-end justify-between gap-2">
        <div onClick={(e) => e.stopPropagation()}>
          <LikeButton postId={id} initialIsLiked={initialIsLiked} currentUserId={currentUserId} />
        </div>
        <div className="flex flex-col items-end gap-1 text-sm md:text-xs lg:text-sm">
          {dDayBadge}
          <span className="text-gray-400">{formatTimeAgo(createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
