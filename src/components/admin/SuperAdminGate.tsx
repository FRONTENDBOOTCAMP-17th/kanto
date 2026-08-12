"use client";

import { ShieldAlert, X } from "lucide-react";

export function SuperAdminGate() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-[#ebeef0] bg-white p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.14)]">
        <button
          onClick={() => window.history.back()}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <ShieldAlert className="h-7 w-7 text-amber-500" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[17px] font-bold text-slate-900">슈퍼어드민 전용입니다</p>
          <p className="mt-1.5 text-[13.5px] text-slate-400">이 페이지는 슈퍼어드민만 접근할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}
