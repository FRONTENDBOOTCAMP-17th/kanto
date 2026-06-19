import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPage,
  onPageChange,
}: PaginationProps) => {
  const canGoPrev = currentPage !== 1;
  const canGoNext = currentPage < totalPage;

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPage <= 5) {
      return Array.from({ length: totalPage }, (_, i) => i + 1);
    }

    const delta = 1;
    const range: (number | "...")[] = [];

    for (let i = 1; i <= totalPage; i++) {
      const isEdge = i === 1 || i === totalPage;
      const isNearCurrent = i >= currentPage - delta && i <= currentPage + delta;

      if (isEdge || isNearCurrent) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }

    return range;
  };

  return (
    <>
      {/* 데스크탑 */}
      <div className="hidden sm:flex items-center justify-center gap-[18px]">
        <button
          aria-label="이전 페이지"
          disabled={!canGoPrev}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 text-gray-400 disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`dots-${idx}`} className="text-sm text-gray-400">
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={
                page === currentPage
                  ? "text-[20px] font-medium text-teal-700"
                  : "text-sm text-gray-400"
              }
            >
              {page}
            </button>
          ),
        )}

        <button
          aria-label="다음 페이지"
          disabled={!canGoNext}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 text-gray-400 disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 모바일 */}
      <div className="flex sm:hidden items-center justify-center gap-7">
        <button
          aria-label="이전 페이지"
          disabled={!canGoPrev}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex h-10 w-10 items-center justify-center text-gray-500 disabled:opacity-40"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-baseline gap-1">
          <span className="text-[22px] font-medium text-teal-700">
            {currentPage}
          </span>
          <span className="text-sm text-gray-400">/ {totalPage}</span>
        </div>

        <button
          aria-label="다음 페이지"
          disabled={!canGoNext}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex h-10 w-10 items-center justify-center text-gray-500 disabled:opacity-40"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </>
  );
};
