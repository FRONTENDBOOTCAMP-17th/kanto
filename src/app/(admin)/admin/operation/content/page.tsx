"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, Zap } from "lucide-react";
import ProfanitySection from "./_components/ProfanitySection";
import SpamSection from "./_components/SpamSection";
import { OperationPageHeader } from "@/components/admin/OperationPageHeader";

type Section = "profanity" | "spam";

export default function ContentPage() {
  const [section, setSection] = useState<Section>("profanity");

  return (
    <div className="p-6 lg:p-8">
      
      <OperationPageHeader
        icon={ShieldCheck}
        title="콘텐츠 관리"
        description="금칙어 필터 룰과 스팸 감지 설정을 관리합니다."
      />

      
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
