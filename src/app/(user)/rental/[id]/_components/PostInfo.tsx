"use client";

import { formatTimeAgo } from "@/utils/formatTime";
import { Clock, Eye } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { RentalWithPost } from "@/type/rental/rentalDetail";
import InteractionButtons from "@/components/common/InteractionButtons";
import type { Locale } from "@/i18n/config";

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
  return (
    <div className="mt-2 md:mt-4 border border-gray-200 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold">{rental.posts.title}</h1>
        <InteractionButtons
          postId={postId}
          userId={userId}
          initialLiked={initialLiked}

          initialReported={initialReported}
          size="lg"
          className="hidden md:flex shrink-0"
        />
      </div>
      <p className="text-gray-500 text-sm mt-1">
        {rental.room_type ? te(`roomType.${rental.room_type}`) : ""} · {rental.location_detail ?? (rental.location === "그 외 지역" ? te("tradeLocation.otherAreas") : rental.location)}
      </p>

      <div className="text-gray-400 text-sm flex items-center gap-4 mt-3">
        <span className="flex items-center leading-none gap-1">
          <Clock className="w-4 h-4" />
          <time dateTime={rental.created_at}>{formatTimeAgo(rental.created_at, locale)}</time>
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {t("viewCount", { count: rental.posts.view_count })}
        </span>
        <InteractionButtons
          postId={postId}
          userId={userId}
          initialLiked={initialLiked}

          initialReported={initialReported}
          size="sm"
          className="md:hidden ml-auto"
        />
      </div>

      <hr className="border-gray-200 my-4" />

      <h2 className="text-xl font-semibold mb-3">{t("description")}</h2>
      <p className="text-gray-700 whitespace-pre-line">{rental.description}</p>
    </div>
  );
}
