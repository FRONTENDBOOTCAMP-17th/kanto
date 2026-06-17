"use client";

import { Clock, Eye, Users } from "lucide-react";
import { formatTimeAgo } from "@/utils/formatTime";
import type { JobDetail } from "@/type/job/jobsDetail";
import InteractionButtons from "@/components/common/InteractionButtons";
import VerifyAuthor from "@/components/common/VerifyAuthor";

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
          <h1 className="text-2xl md:text-3xl font-bold">{job.posts.title}</h1>
          <p className="text-gray-500 md:text-lg mt-1">{job.company_name}</p>
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
      <div className="flex items-center justify-between gap-4 text-sm md:text-base text-gray-400">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <time dateTime={job.posts.created_at}>{formatTimeAgo(job.posts.created_at)}</time>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {job.posts.view_count}
          </span>
          {job.applicant_count && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              지원자: {job.applicant_count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <InteractionButtons
            postId={job.post_id}
            userId={userId}
            initialLiked={initialLiked}
            initialReported={initialReported}
            size="sm"
            className="md:hidden"
          />
          <VerifyAuthor
            authorAuthId={job.posts.users?.auth_id}
            editPath={`/job/${job.post_id}/edit`}
            postId={job.post_id}
            redirectPath="/job"
            className="hidden md:flex gap-4 mr-2"
          />
        </div>
      </div>
      <VerifyAuthor
        authorAuthId={job.posts.users?.auth_id}
        editPath={`/job/${job.post_id}/edit`}
        postId={job.post_id}
        redirectPath="/job"
        className="md:hidden gap-6"
      />
    </div>
  );
}
