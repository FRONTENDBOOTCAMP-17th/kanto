"use client";

import { Clock, Eye, Users } from "lucide-react";
import { formatTimeAgo } from "@/utils/formatTime";
import type { JobDetail } from "@/type/job/jobsDetail";
import InteractionButtons from "@/components/common/InteractionButtons";

interface JobTitleProps {
  job: JobDetail;
  userId: number | undefined;
  initialLiked: boolean;
  initialReported: boolean;
}

export default function JobTitle({ job, userId, initialLiked, initialReported }: JobTitleProps) {
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
          size="lg"
          className="hidden md:flex shrink-0"
        />
      </div>
      <div className="flex gap-4 text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <time dateTime={job.posts.created_at}>{formatTimeAgo(job.posts.created_at)}</time>
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          조회수: {job.posts.view_count}
        </span>
        {job.applicant_count && (
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            지원자: {job.applicant_count}
          </span>
        )}
        <InteractionButtons
          postId={job.post_id}
          userId={userId}
          initialLiked={initialLiked}
          initialReported={initialReported}
          size="sm"
          className="md:hidden ml-auto"
        />
      </div>
    </div>
  );
}
