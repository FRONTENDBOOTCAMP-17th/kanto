"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { JobWithPost } from "@/type/job/jobList";
import { getDeadlineDiff } from "@/utils/formatTime";

interface JobManageListProps {
  jobs: JobWithPost[];
  onJobStatusChange: (postId: number, status: string) => void;
}

export function JobManageList({ jobs, onJobStatusChange }: JobManageListProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const toggleStatus = async (postId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    setLoadingId(postId);
    const { error } = await supabase.from("posts").update({ status: nextStatus }).eq("id", postId);
    if (error) {
      alert("상태 변경에 실패했습니다.");
    } else {
      onJobStatusChange(postId, nextStatus);
    }
    setLoadingId(null);
  };

  if (jobs.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-[10px] tracking-[0.4em] text-white/15 uppercase">등록된 공고가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {jobs.map((job) => {
        const jobData = job.jobs?.[0];
        if (!jobData) return null;
        const deadlineDiff = getDeadlineDiff(jobData.deadline);
        const isExpired = deadlineDiff < 0;
        const isActive = job.status === "active";

        const deadlineLabel = !isActive
          ? "비공개"
          : isExpired
            ? "마감"
            : `D-${deadlineDiff}`;

        const deadlineColor = !isActive
          ? "text-white/20"
          : isExpired
            ? "text-red-400/60"
            : "text-white/40";

        return (
          <div
            key={job.id}
            className={`flex items-center justify-between py-6 group transition-opacity ${!isActive ? "opacity-40" : ""}`}
          >
            <div className="flex items-center gap-8 min-w-0">
              <span className={`text-[11px] tabular-nums font-normal w-12 shrink-0 ${deadlineColor}`}>
                {deadlineLabel}
              </span>
              <div className="min-w-0">
                <p className="text-white font-normal truncate group-hover:text-white/80 transition-colors">
                  {job.title}
                </p>
                <p className="text-[11px] text-white/25 mt-0.5">
                  {jobData.employee_type} · {jobData.deadline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0 ml-4">
              <Link
                href={`/job/${job.id}/edit`}
                className="text-[10px] tracking-[0.2em] text-white/20 hover:text-white/60 transition-colors uppercase"
              >
                편집
              </Link>
              <button
                type="button"
                onClick={() => toggleStatus(job.id, job.status ?? "inactive")}
                disabled={loadingId === job.id}
                className="text-[10px] tracking-[0.2em] text-white/20 hover:text-white/60 transition-colors uppercase disabled:opacity-30"
              >
                {isActive ? "비공개" : "공개"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
