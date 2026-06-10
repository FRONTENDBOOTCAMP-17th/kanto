"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UsedGoodsCard } from "@/components/usedgoods/UsedGoodsCard";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import type { UsedGoodsWithPost } from "@/type/usedGoods";

interface Props {
  initialPosts: UsedGoodsWithPost[];
  initialLikedIds: number[];
}

export function UsedGoodsList({ initialPosts, initialLikedIds }: Props) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const likedSet = new Set(initialLikedIds);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) setCurrentUserId(data.id);
        });
    });
  }, []);

  if (initialPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
        <p className="text-lg font-medium">등록된 상품이 없습니다</p>
        <p className="text-sm">첫 번째 판매자가 되어보세요!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {initialPosts.map((post) => {
          const goods = post.used_goods?.[0];
          return (
            <UsedGoodsCard
              key={post.id}
              id={post.id}
              title={post.title}
              price={goods?.price ?? 0}
              locationText={
                goods?.location_type === "그 외 지역"
                  ? (goods.location_custom ?? "")
                  : (goods?.location_type ?? "")
              }
              images={goods?.images ?? null}
              createdAt={post.created_at}
              likeCount={post.like_count ?? 0}
              initialIsLiked={likedSet.has(post.id)}
              sellerName={post.users?.name ?? ""}
              currentUserId={currentUserId}
              onLoginRequired={() => setShowLoginModal(true)}
            />
          );
        })}
      </div>
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
