"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Clock, Heart, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { LikeButton } from "@/components/common/LikeButton";
import { formatTimeAgo } from "@/utils/formatTime";

export interface ContentCardProps {
  href: string;
  images: string[];
  title: string;
  price: number | null;
  location: string | null;
  createdAt: string;
  likeCount: number;
  postId: number;
  initialIsLiked: boolean;
  currentUserId: number | null;
  badge?: React.ReactNode;
  subtitle?: string;
  tags?: React.ReactNode;
  listOnMobile?: boolean;
}

export function ContentCard({
  href,
  images,
  title,
  price,
  location,
  createdAt,
  likeCount,
  postId,
  initialIsLiked,
  currentUserId,
  badge,
  subtitle,
  tags,
  listOnMobile = false,
}: ContentCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [count, setCount] = useState(likeCount);
  const hasImages = images.length > 0;
  const hasCarousel = images.length > 1;

  return (
    <div className="relative h-full">
      <Link href={href} className="h-full block">
        <Card
          className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full ${
            listOnMobile
              ? "flex flex-row gap-3 p-3 md:flex-col md:p-0 md:gap-0"
              : "flex flex-col p-0"
          }`}
        >
          {/* 이미지 영역 */}
          <div
            className={`relative overflow-hidden bg-gray-100 shrink-0 ${
              listOnMobile
                ? "w-20 h-20 rounded-lg md:w-full md:h-auto md:aspect-square md:rounded-none"
                : "aspect-square"
            }`}
          >
            {hasImages ? (
              <>
                {images.map((src, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      idx === currentImageIndex ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <ImageWithFallback
                      src={src}
                      alt={`${title} ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
                {hasCarousel && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? "bg-white w-4"
                            : "bg-white/60 hover:bg-white/80 w-1.5"
                        }`}
                        aria-label={`이미지 ${idx + 1}로 이동`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
            )}
            {badge && <div className="absolute top-2 left-2 z-10">{badge}</div>}
          </div>

          {/* 콘텐츠 영역 */}
          <div
            className={`flex flex-col flex-1 min-w-0 ${
              listOnMobile ? "py-0.5 md:p-4" : "p-4"
            }`}
          >
            {tags && <div className="flex gap-2 mb-2">{tags}</div>}
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
              {title}
            </h3>
            <p className="text-base font-bold text-gray-900 mb-1">
              {price != null ? `₱${price.toLocaleString()}` : "가격 협의"}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-400 mb-1 truncate">{subtitle}</p>
            )}
            {location && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{location}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <time dateTime={createdAt}>{formatTimeAgo(createdAt)}</time>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{count}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>

      <LikeButton
        postId={postId}
        initialIsLiked={initialIsLiked}
        currentUserId={currentUserId}
        onLikeChange={(liked) => setCount((prev) => liked ? prev + 1 : Math.max(prev - 1, 0))}
        className={`card-like-btn bg-white/90 hover:bg-white z-10 ${
          listOnMobile ? "hidden md:flex" : "flex"
        }`}
      />
    </div>
  );
}
