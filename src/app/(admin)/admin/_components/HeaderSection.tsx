"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function HeaderSection() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[31px] font-extrabold tracking-tight text-slate-900">
          대시보드
        </h1>
        <p className="mt-1.5 text-[15px] text-slate-500">
          필리핀 한인 커뮤니티 Kanto 운영 현황을 한눈에 확인하세요
        </p>
      </div>
      <span className="flex items-center gap-1.5 whitespace-nowrap rounded-[11px] border border-[#e7ebee] bg-white px-[13px] py-[9px] text-[13px] font-medium text-slate-400">
        <Clock className="h-[15px] w-[15px]" strokeWidth={2} />
        {timeStr} 기준
      </span>
    </div>
  );
}
