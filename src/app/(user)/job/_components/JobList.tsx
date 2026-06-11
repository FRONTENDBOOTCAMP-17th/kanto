"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { JobCard } from "./JobCard";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import type { JobWithPost } from "@/type/job/jobList";

interface Props {
  posts: JobWithPost[];
  likedIds: number[];
}

export function JobList({ posts, likedIds }: Props) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const likedSet = new Set(likedIds);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) setCurrentUserId(data.id);
        });
    });
  }, []);

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
              likeCount={post.like_count ?? 0}
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
