"use client";

import { JobCard } from "./JobCard";
import { EmptyState } from "@/components/common/EmptyState";
import type { JobWithPost } from "@/type/job/jobList";

interface Props {
  posts: JobWithPost[];
  likedIds: number[];
  currentUserId: number | null;
}

export function JobList({ posts, likedIds, currentUserId }: Props) {
  const likedSet = new Set(likedIds);

  if (posts.length === 0) {
    return <EmptyState message="등록된 구인공고가 없습니다" description="첫 번째 공고를 등록해보세요!" />;
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
            initialIsLiked={likedSet.has(post.id)}
            currentUserId={currentUserId}
          />
        );
      })}
    </div>
  );
}
