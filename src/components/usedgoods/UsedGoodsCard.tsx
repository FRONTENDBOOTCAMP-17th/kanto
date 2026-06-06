"use client";

import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";

import { useState, useEffect } from "react";
import { Heart, MapPin, Clock } from "lucide-react";

interface UsedGoodsCardProps {
  id: number;
  title: string;
  price: number;
  locationText: string;
  images: string[] | null;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
  sellerName: string;
  onLikeToggle: (id: number) => void;
}

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function UsedGoodsCard({
  id,
  title,
  price,
  locationText,
  images,
  createdAt,
  likeCount,
  isLiked,
  sellerName,
  onLikeToggle,
}: UsedGoodsCardProps) {
  const thumbnail = images?.[0] ?? "/fallback-image.svg";
  const [relativeTime, setRelativeTime] = useState("");

  useEffect(() => {
    setRelativeTime(formatTimeAgo(createdAt));
  }, [createdAt]);

  return (
    <div className="relative">
      <Link href={`/usedgoods/${id}`}>
        <Card
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            <ImageWithFallback
              src={thumbnail}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onLikeToggle(id);
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
              aria-label={isLiked ? "찜 해제" : "찜하기"}
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked ? "fill-red-500 text-red-500" : "text-gray-700"
                }`}
              />
            </button>
          </div>

          <div className="p-4">
            <h3
              className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm"
            >
              {title}
            </h3>
            <p className="text-lg font-bold text-gray-900 mb-1">
              ₱{price.toLocaleString()}
            </p>
            {sellerName && (
              <p className="text-xs text-gray-400 mb-2">{sellerName}</p>
            )}
            <div
              className="flex items-center gap-2 text-xs text-gray-500 mb-1"
            >
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="line-clamp-1">{locationText}</span>
            </div>
            <div
              className="flex items-center justify-between text-xs text-gray-500"
            >
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{relativeTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{likeCount ?? 0}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
