"use client";

import { useTranslations } from "next-intl";
import { JobCard } from "./JobCard";
import { EmptyState } from "@/components/common/EmptyState";
import type { JobWithPost } from "@/type/job/jobList";

interface Props {
  posts: JobWithPost[];
  likedIds: number[];
  currentUserId: number | null;
  emptyMessage?: string;
}

export function JobList({ posts, likedIds, currentUserId, emptyMessage }: Props) {
  const t = useTranslations("Job");
  const likedSet = new Set(likedIds);

  if (posts.length === 0) {
    return <EmptyState message={emptyMessage ?? t("empty")} />;
  }

  return (
    <div className="flex flex-col divide-y divide-gray-200 border-t border-b border-gray-200">
      {posts.map((post) => {
        const job = post.jobs?.[0];
        if (!job) return null;
        return (
          <JobCard
            key={post.id}
            id={post.id}
            title={post.title}
            companyName={job.company_name}
            salary={job.salary}
            salaryType={job.salary_type}
            locationText={job.location_custom ?? job.location_type}
            createdAt={post.created_at}
            deadline={job.deadline}
            employeeType={job.employee_type}
            workHours={job.is_time_negotiable ? "시간협의" : (job.work_hours ?? "")}
            initialIsLiked={likedSet.has(post.id)}
            currentUserId={currentUserId}
          />
        );
      })}
    </div>
  );
}
