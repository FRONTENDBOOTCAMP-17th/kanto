"use client";

import { UserCircle2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobDetail } from "@/type/job/jobsDetail";

export default function JobAuthorInfo({ job }: { job: JobDetail }) {
  const name = job.manager_name ?? job.posts.users.name;

  return (
    <div className="p-6 flex flex-col gap-4">
      <h2 className="font-semibold text-base">담당자 정보</h2>
      <div className="flex items-center gap-3">
        <UserCircle2 className="w-10 h-10 text-gray-400 shrink-0" />
        <div>
          <p className="font-medium">{name}</p>
          {job.manager_title && (
            <p className="text-sm text-gray-500">{job.manager_title}</p>
          )}
        </div>
      </div>
      {(job.manager_phone || job.manager_email) && (
        <div className="space-y-1 text-sm text-gray-600">
          {job.manager_phone && (
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              {job.manager_phone}
            </p>
          )}
          {job.manager_email && (
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {job.manager_email}
            </p>
          )}
        </div>
      )}
      <Button className="w-full bg-teal-500 hover:bg-teal-600">
        지원하기
      </Button>
    </div>
  );
}
