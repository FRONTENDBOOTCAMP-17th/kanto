"use client";

import { Heart, Share2, Siren, Clock, Eye, Users } from "lucide-react";
import { formatTimeAgo } from "@/utils/formatTime";
import type { JobDetail } from "@/type/job/jobsDetail";

export default function JobTitle({ job }: { job: JobDetail }) {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{job.posts.title}</h1>
        <p className="text-gray-500 mt-1">{job.company_name}</p>
      </div>
      <div className="flex gap-2">
        <button className="border p-2 rounded-lg hover:bg-gray-50">
          <Heart className="w-4 h-4 text-pink-400" />
        </button>
        <button className="border p-2 rounded-lg hover:bg-gray-50">
          <Share2 className="w-4 h-4" />
        </button>
        <button className="border p-2 rounded-lg hover:bg-gray-50">
          <Siren className="w-4 h-4 text-red-400" />
        </button>
      </div>
      <div className="flex gap-4 text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {formatTimeAgo(job.posts.created_at)}
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
      </div>
    </div>
  );
}
