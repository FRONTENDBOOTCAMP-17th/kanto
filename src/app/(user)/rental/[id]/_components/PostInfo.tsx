"use client";

import { useState } from "react";
import { formatTimeAgo } from "@/utils/format";
import { useTranslations, useLocale } from "next-intl";
import { RentalWithPost } from "@/type/rental/rentalDetail";
import InteractionButtons from "@/components/common/InteractionButtons";
import type { Locale } from "@/i18n/config";
import { formatBarangayLabel } from "@/type/location";

interface PostInfoProps {
  rental: RentalWithPost;
  userId: number | undefined;
  postId: number;
  initialLiked: boolean;
  initialReported: boolean;
}

export default function PostInfo({
  rental,
  userId,
  postId,
  initialLiked,
  initialReported,
}: PostInfoProps) {
  const t = useTranslations("Rental");
  const te = useTranslations("Enums");
  const locale = useLocale() as Locale;
  const [likeCount, setLikeCount] = useState(rental.posts.like_count ?? 0);

  const handleLikeChange = (liked: boolean) =>
    setLikeCount((prev) => liked ? prev + 1 : Math.max(prev - 1, 0));

  return (
    <div className="mt-6">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{rental.posts.title}</h1>
        <InteractionButtons
          postId={postId}
          userId={userId}
          initialLiked={initialLiked}
          initialReported={initialReported}
          onLikeChange={handleLikeChange}
          size="lg"
          className="hidden md:flex shrink-0"
        />
      </div>
      <p className="text-xs text-gray-400 tracking-wide mt-2">
        {rental.room_type ? te(`roomType.${rental.room_type}`) : ""} ·{" "}
        {rental.location_barangay || rental.location_city
          ? formatBarangayLabel(rental.location_barangay, rental.location_city)
          : (rental.location_detail ??
            (rental.location === "그 외 지역" ? te("tradeLocation.otherAreas") : rental.location))}
      </p>

      <div className="text-gray-400 text-xs flex items-center gap-5 mt-3">
        <time dateTime={rental.created_at}>{formatTimeAgo(rental.created_at, locale)}</time>
        <span className="flex items-center gap-1">
          {t("views")} {t("viewCount", { count: rental.posts.view_count })}
        </span>
        <span className="flex items-center gap-1">
          {t("likes")} {likeCount}
        </span>
        <InteractionButtons
          postId={postId}
          userId={userId}
          initialLiked={initialLiked}
          initialReported={initialReported}
          onLikeChange={handleLikeChange}
          size="sm"
          className="md:hidden ml-auto"
        />
      </div>

      <hr className="border-gray-200 my-8" />

      <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-400 mb-4">{t("description")}</h2>
      <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">{rental.description}</p>
    </div>
  );
}
