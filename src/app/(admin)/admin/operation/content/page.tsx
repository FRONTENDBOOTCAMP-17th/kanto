"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, ChevronLeft, ShieldAlert, Zap } from "lucide-react";
import ProfanitySection from "./_components/ProfanitySection";
import SpamSection from "./_components/SpamSection";

type Section = "profanity" | "spam";

export default function ContentPage() {
  const [section, setSection] = useState<Section>("profanity");

  return (
    <div className="p-6 lg:p-8">
      {/* 페이지 헤더 */}
      <div className="mb-7">
        <Link
          href="/admin/operation"
          className="mb-2 flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          운영 관리
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
            <ShieldCheck className="h-5 w-5 text-teal-600" strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold text-slate-900">콘텐츠 관리</h1>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">
          금칙어 필터 룰과 스팸 감지 설정을 관리합니다.
        </p>
      </div>

      {/* 섹션 탭 */}
      <div className="mb-6">
        <div className="flex w-fit gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
          <button
            onClick={() => setSection("profanity")}
            className={[
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
              section === "profanity"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            <ShieldAlert className="h-4 w-4" strokeWidth={2} />
            금칙어 관리
          </button>
          <button
            onClick={() => setSection("spam")}
            className={[
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
              section === "spam"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            <Zap className="h-4 w-4" strokeWidth={2} />
            스팸 관리
          </button>
        </div>
      </div>

      {section === "profanity" && <ProfanitySection />}
      {section === "spam" && <SpamSection />}
    </div>
  );
}
