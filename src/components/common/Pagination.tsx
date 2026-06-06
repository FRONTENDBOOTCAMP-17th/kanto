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
  const getPageNumbers = () => {
    const startPage = Math.floor((currentPage - 1) / 3) * 3 + 1;

    return Array.from({ length: 3 }, (_, i) => startPage + i).filter(
      (page) => page <= totalPage,
    );
  };

  const canGoNext = currentPage < totalPage;
  const canGoPrev = currentPage !== 1;

  return (
    <div className="flex space-x-2">
      <button
        disabled={!canGoPrev}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft />
      </button>
      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={
            page === currentPage
              ? "bg-teal-400 text-white px-2 border-2 border-teal-400 rounded-md"
              : "bg-white text-black px-2 border-2 border-gray-200 rounded-md"
          }
        >
          {page}
        </button>
      ))}
      <button
        disabled={!canGoNext}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight />
      </button>
    </div>
  );
};
