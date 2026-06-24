"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import type { Company } from "@/type/company";
import type { JobWithPost } from "@/type/job/jobList";
import { CompanyForm } from "./CompanyForm";
import { CompanyInfoSection } from "./CompanyInfoSection";
import { JobManageList } from "./JobManageList";

interface BusinessDashboardProps {
  userId: number;
  company: Company | null;
  initialJobs: JobWithPost[];
}

export function BusinessDashboard({ userId, company: initialCompany, initialJobs }: BusinessDashboardProps) {
  const [company, setCompany] = useState(initialCompany);
  const [jobs, setJobs] = useState(initialJobs);
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing && company) {
    return (
      <CompanyForm
        userId={userId}
        initialData={company}
        onSuccess={(saved) => { setCompany(saved); setIsEditing(false); }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  if (!company) {
    return (
      <main className="flex-1 min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-10">
            <Building2 className="w-5 h-5 text-white/20" />
          </div>
          <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase mb-4">시작하기</p>
          <h2 className="text-3xl font-normal text-white mb-4">아직 등록된 회사가 없습니다</h2>
          <p className="text-white/30 text-sm mb-12 leading-loose">
            회사를 등록하면 구인 공고를 작성하고<br />관리할 수 있습니다.
          </p>
          <Link
            href="/business/company/create"
            className="inline-flex items-center gap-2 bg-white text-black text-sm font-normal px-10 py-4 rounded-lg hover:bg-white/90 transition-colors"
          >
            회사 등록하기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <CompanyInfoSection company={company} onEdit={() => setIsEditing(true)} />

      <section className="border-t border-white/5 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase">공고</p>
            <Link
              href="/job/create"
              className="text-[10px] tracking-[0.3em] text-white/30 hover:text-white transition-colors uppercase"
            >
              + 작성
            </Link>
          </div>
          <JobManageList
            jobs={jobs}
            onJobStatusChange={(postId, status) =>
              setJobs((prev) => prev.map((j) => (j.id === postId ? { ...j, status } : j)))
            }
          />
        </div>
      </section>
    </main>
  );
}
