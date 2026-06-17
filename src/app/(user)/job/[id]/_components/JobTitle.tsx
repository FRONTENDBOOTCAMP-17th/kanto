"use client";

import { useState } from "react";
import { Clock, Eye, Heart, Users } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { formatTimeAgo } from "@/utils/formatTime";
import type { JobDetail } from "@/type/job/jobsDetail";
import InteractionButtons from "@/components/common/InteractionButtons";
import type { Locale } from "@/i18n/config";

interface JobTitleProps {
  job: JobDetail;
  userId: number | undefined;
  initialLiked: boolean;
  initialReported: boolean;
}

export default function JobTitle({ job, userId, initialLiked, initialReported }: JobTitleProps) {
  const t = useTranslations("Job");
  const locale = useLocale() as Locale;
  const [likeCount, setLikeCount] = useState(job.posts.like_count ?? 0);

  const handleLikeChange = (liked: boolean) =>
    setLikeCount((prev) => liked ? prev + 1 : Math.max(prev - 1, 0));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{job.posts.title}</h1>
          <p className="text-gray-500 mt-1">{job.company_name}</p>
        </div>
        <InteractionButtons
          postId={job.post_id}
          userId={userId}
          initialLiked={initialLiked}
          initialReported={initialReported}
          onLikeChange={handleLikeChange}
          size="lg"
          className="hidden md:flex shrink-0"
        />
      </div>
      <div className="flex gap-4 text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <time dateTime={job.posts.created_at}>{formatTimeAgo(job.posts.created_at, locale)}</time>
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {t("viewCount", { count: job.posts.view_count })}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-4 h-4" />
          {likeCount}
        </span>
        {job.applicant_count && (
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {t("applicantCount", { count: job.applicant_count })}
          </span>
        )}
        <InteractionButtons
          postId={job.post_id}
          userId={userId}
          initialLiked={initialLiked}
          initialReported={initialReported}
          onLikeChange={handleLikeChange}
          size="sm"
          className="md:hidden ml-auto"
        />
      </div>
    </div>
  );
}
