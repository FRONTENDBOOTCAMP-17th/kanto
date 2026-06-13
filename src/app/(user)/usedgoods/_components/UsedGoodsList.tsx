"use client";

import type { UsedGoodsWithPost } from "@/type/usedGoods";
import { ContentCard } from "@/components/common/ContentCard";
import { EmptyState } from "@/components/common/EmptyState";

interface Props {
  initialPosts: UsedGoodsWithPost[];
  initialLikedIds: number[];
  currentUserId: number | null;
}

export function UsedGoodsList({ initialPosts, initialLikedIds, currentUserId }: Props) {
  const likedSet = new Set(initialLikedIds);

  if (initialPosts.length === 0) {
    return <EmptyState message="등록된 상품이 없습니다" description="첫 번째 판매자가 되어보세요!" />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {initialPosts.map((post) => {
        const goods = post.used_goods?.[0];
        const images = Array.isArray(goods?.images)
          ? goods.images.filter((img): img is string => typeof img === "string")
          : [];
        const location =
          goods?.location_type === "그 외 지역"
            ? (goods.location_custom ?? "")
            : (goods?.location_type ?? "");

        return (
          <ContentCard
            key={post.id}
            href={`/usedgoods/${post.id}`}
            images={images}
            title={post.title}
            price={goods?.price ?? 0}
            location={location}
            createdAt={post.created_at}
            likeCount={post.like_count ?? 0}
            initialIsLiked={likedSet.has(post.id)}
            currentUserId={currentUserId}
            postId={post.id}
            subtitle={post.users?.name || undefined}
          />
        );
      })}
    </div>
  );
}
