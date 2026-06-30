"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  countLabel?: React.ReactNode;
}

export function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  countLabel,
}: AdminPaginationProps) {
  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 1;
    const range: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-t border-[#f1f4f6] px-[22px] py-4 lg:justify-between">
      {countLabel != null && (
        <span className="hidden lg:inline text-[13px] text-slate-400">{countLabel}</span>
      )}

      
      <div className="hidden lg:flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-[34px] rounded-[9px] border border-[#e7ebee] bg-white px-[13px] text-[13px] font-semibold text-slate-600 disabled:text-slate-300"
        >
          이전
        </button>
        {getPageNumbers().map((n, idx) =>
          n === "..." ? (
            <span key={`dots-${idx}`} className="px-0.5 text-[13px] text-gray-400">
              ···
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              className={[
                "h-[34px] min-w-[34px] rounded-[9px] px-2 text-[13px]",
                n === currentPage
                  ? "border-none bg-teal-500 font-bold text-white"
                  : "border border-[#e7ebee] bg-white font-semibold text-slate-600",
              ].join(" ")}
            >
              {n}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="h-[34px] rounded-[9px] border border-[#e7ebee] bg-white px-[13px] text-[13px] font-semibold text-slate-600 disabled:text-slate-300"
        >
          다음
        </button>
      </div>

      
      <div className="flex lg:hidden items-center gap-7">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="flex h-10 w-10 items-center justify-center text-gray-500 disabled:opacity-40 hover:text-teal-600 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-baseline gap-1">
          <span className="text-[22px] font-medium text-teal-700">{currentPage}</span>
          <span className="text-sm text-gray-400">/ {totalPages}</span>
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="flex h-10 w-10 items-center justify-center text-gray-500 disabled:opacity-40 hover:text-teal-600 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
