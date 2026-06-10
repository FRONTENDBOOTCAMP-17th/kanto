"use client";

import { useState } from "react";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { JobCard } from "./JobCard";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import type { JobWithPost } from "@/type/job/jobList";

interface Props {
  posts: JobWithPost[];
  likedIds: number[];
}

export function JobList({ posts, likedIds }: Props) {
  const currentUserId = useCurrentUserId();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const likedSet = new Set(likedIds);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
        <p className="text-lg font-medium">등록된 구인공고가 없습니다</p>
        <p className="text-sm">첫 번째 공고를 등록해보세요!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
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
              onLoginRequired={() => setShowLoginModal(true)}
            />
          );
        })}
      </div>
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
