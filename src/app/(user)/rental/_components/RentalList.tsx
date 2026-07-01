"use client";

import { useTranslations } from "next-intl";
import { RentalCard } from "./RentalCard";
import { EmptyState } from "@/components/common/EmptyState";
import type { RentalWithPost } from "@/type/rental/rentalList";

interface Props {
  initialPosts: RentalWithPost[];
  initialLikedIds: number[];
  currentUserId: number | null;
  currentPage: number;
}

export function RentalList({ initialPosts, initialLikedIds, currentUserId, currentPage }: Props) {
  const t = useTranslations("Rental");
  const likedSet = new Set(initialLikedIds);

  if (initialPosts.length === 0) {
    return <EmptyState message={t("empty")} description={t("emptyDescription")} />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {initialPosts.map((post) => {
        const rental = post.rentals?.[0];
        return (
          <RentalCard
            key={post.id}
            id={post.id}
            fromPage={currentPage > 1 ? currentPage : undefined}
            title={post.title}
            price={rental?.price ?? null}
            location={rental?.location ?? null}
            locationDetail={rental?.location_detail ?? null}
            barangay={rental?.location_barangay ?? null}
            city={rental?.location_city ?? null}
            createdAt={post.created_at}
            images={(rental?.images as string[] | null) ?? []}
            amenities={(rental?.amenities as string[] | null) ?? []}
            likeCount={post.like_count ?? 0}
            initialIsLiked={likedSet.has(post.id)}
            currentUserId={currentUserId}
            isPopular={post.is_popular ?? false}
            isSold={post.is_sold ?? false}
          />
        );
      })}
    </div>
  );
}
