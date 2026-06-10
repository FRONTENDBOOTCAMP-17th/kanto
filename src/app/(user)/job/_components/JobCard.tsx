"use client";

import { useRouter } from "next/navigation";
import { Heart, MapPin, CheckCircle2 } from "lucide-react";
import { useJobLike } from "@/hooks/job/useJobLike";

interface JobCardProps {
  id: number;
  title: string;
  companyName: string;
  salary: number;
  salaryType: string | null;
  locationText: string;
  initialIsLiked: boolean;
  currentUserId: number | null;
  onLoginRequired: () => void;
}

export function JobCard({
  id,
  title,
  companyName,
  salary,
  salaryType,
  locationText,
  initialIsLiked,
  currentUserId,
  onLoginRequired,
}: JobCardProps) {
  const router = useRouter();
  const { isLiked, handleLike } = useJobLike({ id, currentUserId, initialIsLiked, onLoginRequired });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-base truncate">{title}</p>
        <div className="flex items-center gap-1 text-sm text-teal-600">
          <span>{companyName}</span>
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
        <p className="text-sm text-gray-800 mt-0.5">
          ₱{salary.toLocaleString()}
          {salaryType && <span className="text-gray-400 ml-1">/ {salaryType}</span>}
        </p>
        <div className="flex items-center gap-1 text-xs text-teal-500 mt-0.5">
          <MapPin className="w-3 h-3" />
          <span>{locationText}</span>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between gap-4 ml-4 shrink-0">
        <button
          type="button"
          onClick={handleLike}
          aria-label={isLiked ? "찜 취소" : "찜하기"}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isLiked ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-red-400"
            }`}
          />
        </button>
        <button
          type="button"
          onClick={() => router.push(`/job/${id}`)}
          className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
        >
          지원하기
        </button>
      </div>
    </div>
  );
}
