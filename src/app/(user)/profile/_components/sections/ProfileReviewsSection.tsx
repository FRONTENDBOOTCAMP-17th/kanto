"use client";

import { Star } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/config";
import type { ReviewWithReviewer } from "@/type/review";
import { formatTimeAgo } from "@/utils/format";

interface Props {
  reviews: ReviewWithReviewer[];
  avgRating: number;
  reviewCount: number;
}

export function ProfileReviewsSection({ reviews, avgRating, reviewCount }: Props) {
  const t = useTranslations("Profile.reviews");
  const locale = useLocale() as Locale;
  const ratingText = avgRating.toFixed(1);

  return (
    <div className="px-5 md:px-0 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        </div>
        <div className="flex items-center gap-3 mb-5" aria-label={t("ratingAria", { rating: ratingText, count: reviewCount })}>
          <span className="text-3xl font-bold text-gray-900" aria-hidden="true">{ratingText}</span>
          <div className="flex gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-400" aria-hidden="true">{t("count", { count: reviewCount })}</span>
        </div>

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <Star className="w-8 h-8 text-gray-200 fill-gray-200" />
            <p className="text-sm text-gray-400">{t("empty")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {review.reviewer?.name ?? "알 수 없음"}
                    </span>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                      {review.role === "buyer" ? t("roleBuyer") : t("roleSeller")}
                    </span>
                  </div>
                  <time dateTime={review.created_at} className="shrink-0 text-xs text-gray-400">
                    {formatTimeAgo(review.created_at, locale)}
                  </time>
                </div>
                <div className="mt-1.5 flex gap-0.5" aria-label={t("ratingAria", { rating: review.rating, count: 1 })}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      aria-hidden="true"
                      className={`w-3.5 h-3.5 ${i <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`}
                    />
                  ))}
                </div>
                {review.content && (
                  <p className="mt-2 text-sm text-gray-700 break-keep whitespace-pre-wrap">{review.content}</p>
                )}
                {review.post_title && (
                  <p className="mt-2 text-xs text-gray-400 truncate">{review.post_title}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
