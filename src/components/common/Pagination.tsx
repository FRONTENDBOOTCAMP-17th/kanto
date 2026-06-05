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
    <div>
      <button
        disabled={!canGoPrev}
        onClick={() => onPageChange(currentPage - 1)}
      >
        이전
      </button>
      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={
            page === currentPage
              ? "bg-teal-400 text-white"
              : "bg-white text-black"
          }
        >
          {page}
        </button>
      ))}
      <button
        disabled={!canGoNext}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음
      </button>
    </div>
  );
};
