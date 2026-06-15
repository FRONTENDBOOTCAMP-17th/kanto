"use client";

import { RentalCard } from "./RentalCard";
import { EmptyState } from "@/components/common/EmptyState";
import type { RentalWithPost } from "@/type/rental/rentalList";

interface Props {
  initialPosts: RentalWithPost[];
  initialLikedIds: number[];
  currentUserId: number | null;
}

export function RentalList({ initialPosts, initialLikedIds, currentUserId }: Props) {
  const likedSet = new Set(initialLikedIds);

  if (initialPosts.length === 0) {
    return <EmptyState message="등록된 매물이 없습니다" description="첫 번째 매물을 등록해보세요!" />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {initialPosts.map((post) => {
        const rental = post.rentals?.[0];
        return (
          <RentalCard
            key={post.id}
            id={post.id}
            title={post.title}
            price={rental?.price ?? null}
            location={rental?.location ?? null}
            locationDetail={rental?.location_detail ?? null}
            createdAt={post.created_at}
            images={(rental?.images as string[] | null) ?? []}
            amenities={(rental?.amenities as string[] | null) ?? []}
            likeCount={post.like_count ?? 0}
            initialIsLiked={likedSet.has(post.id)}
            currentUserId={currentUserId}
          />
        );
      })}
    </div>
  );
}
