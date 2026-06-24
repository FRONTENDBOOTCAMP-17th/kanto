"use client";

import { useTranslations } from "next-intl";
import { JobCard } from "./JobCard";
import { EmptyState } from "@/components/common/EmptyState";
import type { JobWithPost } from "@/type/job/jobList";

interface Props {
  posts: JobWithPost[];
  likedIds: number[];
  currentUserId: number | null;
  currentPage: number;
  emptyMessage?: string;
}

export function JobList({ posts, likedIds, currentUserId, currentPage, emptyMessage }: Props) {
  const t = useTranslations("Job");
  const likedSet = new Set(likedIds);

  if (posts.length === 0) {
    return <EmptyState message={emptyMessage ?? t("empty")} />;
  }

  return (
    <div className="border-t border-b border-gray-200">
      
      <div className="hidden md:flex justify-between gap-3 md:gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-2">{t("colCompany")}</div>
          <div className="flex-4 border-l px-4">{t("colPosition")}</div>
          <div className="flex-3">{t("colSalaryLocation")}</div>
          <div className="flex-2">{t("colWorkHours")}</div>
        </div>
        <div className="w-24 text-right">{t("colDeadline")}</div>
      </div>
      <div className="flex flex-col divide-y divide-gray-200">
      {posts.map((post) => {
        const job = post.jobs?.[0];
        if (!job) return null;
        return (
          <JobCard
            key={post.id}
            id={post.id}
            fromPage={currentPage > 1 ? currentPage : undefined}
            title={post.title}
            companyName={job.company_name}
            salary={job.salary}
            salaryType={job.salary_type}
            locationText={job.location_custom ?? job.location_type}
            createdAt={post.created_at}
            deadline={job.deadline}
            employeeType={job.employee_type}
            workHours={job.is_time_negotiable ? t("form.timeNegotiable") : (job.work_hours ?? "")}
            initialIsLiked={likedSet.has(post.id)}
            currentUserId={currentUserId}
          />
        );
      })}
      </div>
    </div>
  );
}
