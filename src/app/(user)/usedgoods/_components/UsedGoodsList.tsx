"use client";

import { useTranslations } from "next-intl";
import type { UsedGoodsWithPost } from "@/type/usedGoods";
import { ContentCard } from "@/components/common/ContentCard";
import { EmptyState } from "@/components/common/EmptyState";

interface Props {
  initialPosts: UsedGoodsWithPost[];
  initialLikedIds: number[];
  currentUserId: number | null;
  currentPage: number;
}

export function UsedGoodsList({ initialPosts, initialLikedIds, currentUserId, currentPage }: Props) {
  const t = useTranslations("UsedGoods");
  const likedSet = new Set(initialLikedIds);

  if (initialPosts.length === 0) {
    return <EmptyState message={t("empty")} description={t("emptyDescription")} />;
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

        const reservedBadge = !post.is_sold && post.is_reserved ? (
          <span className="rounded bg-teal-400 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {t("reserved")}
          </span>
        ) : undefined;

        return (
          <ContentCard
            key={post.id}
            href={`/usedgoods/${post.id}${currentPage > 1 ? `?fromPage=${currentPage}` : ""}`}
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
            badge={reservedBadge}
            soldOverlay={post.is_sold}
          />
        );
      })}
    </div>
  );
}
