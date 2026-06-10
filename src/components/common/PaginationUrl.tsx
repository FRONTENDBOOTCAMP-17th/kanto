"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/common/Pagination";

interface Props {
  currentPage: number;
  totalPage: number;
}

export function PaginationUrl({ currentPage, totalPage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) params.delete("page");
    else params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPage={totalPage}
      onPageChange={handlePageChange}
    />
  );
}
