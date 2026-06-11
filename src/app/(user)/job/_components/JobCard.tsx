"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { LikeButton } from "@/components/common/LikeButton";

interface JobCardProps {
  id: number;
  title: string;
  companyName: string;
  salary: number;
  salaryType: string | null;
  locationText: string;
  initialIsLiked: boolean;
}

export function JobCard({
  id,
  title,
  companyName,
  salary,
  salaryType,
  locationText,
  initialIsLiked,
}: JobCardProps) {
  const router = useRouter();

  return (
    <div
      className="bg-white px-5 py-4 flex justify-between gap-3 hover:bg-gray-50 transition-colors cursor-pointer group"
      onClick={() => router.push(`/job/${id}`)}
    >
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div>
          <p className="font-semibold text-gray-900 text-base truncate transition-colors">
            {title}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{companyName}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-800">
            ₱ {salary.toLocaleString()}
            {salaryType && <span className="text-gray-400 font-normal ml-1">/ {salaryType}</span>}
          </span>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>{locationText}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <LikeButton postId={id} initialIsLiked={initialIsLiked} />
      </div>
    </div>
  );
}
