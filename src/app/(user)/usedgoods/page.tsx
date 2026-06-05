"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { UsedGoodsCard } from "@/components/usedgoods/UsedCardComponent";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";

import { Plus } from "lucide-react";

import type { UsedGoodsWithPost } from "@/type/usedGoods";

interface UsedGoodsListItem {
  id: number;
  title: string;
  price: number;
  locationText: string;
  images: string[] | null;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
}

function toListItem(item: UsedGoodsWithPost, likedIds: Set<number>): UsedGoodsListItem {
  return {
    id: item.id,
    title: item.title,
    price: item.used_goods.price,
    locationText:
      item.used_goods.location_type === "그 외 지역"
        ? item.used_goods.location_custom
        : item.used_goods.location_type,
    images: item.used_goods.images,
    createdAt: item.created_at,
    likeCount: item.like_count,
    isLiked: likedIds.has(item.id),
  };
}

function UsedGoodsContent() {
  const router = useRouter();

  const [items, setItems] = useState<UsedGoodsListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      // TODO: Supabase 쿼리 연결
      // 1. posts 테이블에서 used_goods(*), likes(count) 조인하여 목록 조회
      // 2. 로그인 상태면 likes 테이블에서 현재 유저가 찜한 post_id 목록 조회
      // 3. likedIds Set 생성 후 toListItem으로 매핑 → setItems

      setLoading(false);
    };
    init();
  }, []);

  const handleLikeToggle = (id: number) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    // TODO: Supabase likes 테이블 toggle
  };

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

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400">로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <p className="text-lg font-medium">등록된 상품이 없습니다</p>
          <p className="text-sm">첫 번째 판매자가 되어보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <UsedGoodsCard
              key={item.id}
              {...item}
              onLikeToggle={handleLikeToggle}
            />
          ))}
        </div>
      )}

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
}

export default function UsedGoodsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Suspense fallback={<div className="flex-1" />}>
        <UsedGoodsContent />
      </Suspense>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
