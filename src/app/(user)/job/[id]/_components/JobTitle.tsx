"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatTimeAgo } from "@/utils/format";
import type { JobDetail } from "@/type/job/jobsDetail";
import InteractionButtons from "@/components/common/InteractionButtons";
import type { Locale } from "@/i18n/config";

interface JobTitleProps {
  job: JobDetail;
  userId: number | undefined;
  initialLiked: boolean;
  initialReported: boolean;
}

export default function JobTitle({
  job,
  userId,
  initialLiked,
  initialReported,
}: JobTitleProps) {
  const t = useTranslations("Job");
  const locale = useLocale() as Locale;

  const [likeCount, setLikeCount] = useState(job.posts.like_count ?? 0);

  const handleLikeChange = (liked: boolean) =>
    setLikeCount((prev) => (liked ? prev + 1 : Math.max(prev - 1, 0)));

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {job.posts.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{job.company_name}</p>
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

      <div className="text-gray-400 text-xs flex items-center gap-5 mt-3">
        <time dateTime={job.posts.created_at}>
          {formatTimeAgo(job.posts.created_at, locale)}
        </time>
        <span>{t("views")} {job.posts.view_count}</span>
        <span>{t("likes")} {likeCount}</span>
        {job.applicant_count && (
          <span>{t("applicantCount", { count: job.applicant_count })}</span>
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
