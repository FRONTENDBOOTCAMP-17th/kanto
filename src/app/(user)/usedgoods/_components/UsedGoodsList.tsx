"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useLikes } from "@/hooks/useLikes";

import { Button } from "@/components/ui/button";
import { UsedGoodsCard } from "@/components/usedgoods/UsedGoodsCard";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { Pagination } from "@/components/common/Pagination";

import { Plus } from "lucide-react";

import type { UsedGoodsWithPost } from "@/type/usedGoods";

interface Props {
  initialPosts: UsedGoodsWithPost[];
  initialLikedIds: number[];
}

export function UsedGoodsList({ initialPosts, initialLikedIds }: Props) {
  const router = useRouter();
  const SearchParams = useSearchParams();
  const { items, showLoginModal, setShowLoginModal, handleLikeToggle } =
    useLikes(initialPosts, initialLikedIds);

  const currentPage = Number(SearchParams.get("page") ?? 1);

  const handlePageChange = (page: number) => {
    router.push(`/usedgoods?page=${page}`);
  };

  const ITEMS_PER_PAGE = 12;
  const totalPage = Math.ceil(items.length / ITEMS_PER_PAGE);
  const pagedItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">중고거래</h1>
        <Button
          className="bg-teal-500 hover:bg-teal-600 text-white gap-1"
          onClick={() => router.push("/usedgoods/create")}
        >
          <Plus className="w-4 h-4" />
          글쓰기
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <p className="text-lg font-medium">등록된 상품이 없습니다</p>
          <p className="text-sm">첫 번째 판매자가 되어보세요!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {pagedItems.map((item) => (
              <UsedGoodsCard
                key={item.id}
                {...item}
                onLikeToggle={handleLikeToggle}
              />
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Pagination
              currentPage={currentPage}
              totalPage={totalPage}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
}
