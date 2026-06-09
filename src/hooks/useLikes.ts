import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/type/supabase";
import type { UsedGoodsWithPost } from "@/type/usedGoods";

export interface UsedGoodsListItem {
  id: number;
  title: string;
  price: number;
  locationText: string;
  category: string;
  images: Json | null;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
  sellerName: string;
}

// Supabase 원본 데이터를 화면용 UsedGoodsListItem으로 변환. 찜 여부(isLiked)도 여기서 판단.
export function formatUsedGoodsItemWithLike(
  item: UsedGoodsWithPost,
  likedIds: Set<number>,
): UsedGoodsListItem {
  const goods = item.used_goods?.[0];
  return {
    id: item.id,
    title: item.title,
    price: goods?.price ?? 0,
    locationText:
      goods?.location_type === "그 외 지역"
        ? (goods.location_custom ?? "")
        : (goods?.location_type ?? ""),
    category: goods?.category ?? "",
    images: goods?.images ?? null,
    createdAt: item.created_at,
    likeCount: item.like_count ?? 0,
    isLiked: likedIds.has(item.id),
    sellerName: item.users?.name ?? "",
  };
}

// 찜 관련 상태와 로직을 관리하는 커스텀 훅. 로그인 세션 확인 및 찜 목록 초기화, 찜 토글 기능 제공.
export function useLikes(
  initialPosts: UsedGoodsWithPost[],
  initialLikedIds: number[],
) {
  const [items, setItems] = useState<UsedGoodsListItem[]>(() => {
    const likedSet = new Set(initialLikedIds);
    return initialPosts.map((post) =>
      formatUsedGoodsItemWithLike(post, likedSet),
    );
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      if (!session) return;

      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single();

      if (userData) setCurrentUserId(userData.id);
    };

    initSession();
  }, []);

  // 찜 버튼 클릭 시 호출. 비로그인이면 로그인 모달 표시, 로그인 상태면 찜 추가/취소 후 DB 반영.
  const handleLikeToggle = async (id: number) => {
    if (!isLoggedIn || currentUserId === null) {
      setShowLoginModal(true);
      return;
    }

    const target = items.find((item) => item.id === id);
    if (!target) return;

    const wasLiked = target.isLiked;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isLiked: !wasLiked,
              likeCount: item.likeCount + (wasLiked ? -1 : 1),
            }
          : item,
      ),
    );

    const { error } = wasLiked
      ? await supabase
          .from("common_likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("target_type", "post")
          .eq("target_id", id)
      : await supabase
          .from("common_likes")
          .insert({ user_id: currentUserId, target_type: "post", target_id: id });

    if (error) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isLiked: wasLiked,
                likeCount: item.likeCount + (wasLiked ? 1 : -1),
              }
            : item,
        ),
      );
    }
  };

  return { items, showLoginModal, setShowLoginModal, handleLikeToggle };
}
