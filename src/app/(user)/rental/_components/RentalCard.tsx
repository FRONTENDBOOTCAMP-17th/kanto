"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, Wifi, AirVent, Car, Utensils, Heart } from "lucide-react";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { formatTimeAgo } from "@/utils/formatTime";
import { toggleLike } from "@/services/likeToggle";

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  aircon: AirVent,
  parking: Car,
  kitchen: Utensils,
};

interface RentalCardProps {
  id: number;
  title: string;
  price: number | null;
  location: string | null;
  locationDetail: string | null;
  createdAt: string;
  images: string[];
  amenities: string[];
  likeCount: number;
  initialIsLiked: boolean;
  currentUserId: number | null;
  onLoginRequired: () => void;
}

export function RentalCard({
  id,
  title,
  price,
  location,
  locationDetail,
  createdAt,
  images,
  amenities,
  likeCount: initialLikeCount,
  initialIsLiked,
  currentUserId,
  onLoginRequired,
}: RentalCardProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const displayLocation =
    location === "그 외 지역" ? (locationDetail ?? location) : location;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUserId === null) {
      onLoginRequired();
      return;
    }
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));

    const { error } = await toggleLike(id, currentUserId, wasLiked);

    if (error) {
      setIsLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  };

  return (
    <div className="relative">
      <Link href={`/rental/${id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            {images.length > 0 ? (
              <>
                {images.map((image, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      idx === currentImageIndex ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`${title} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </div>
                ))}
                {images.length > 1 && (
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
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <span className="text-gray-400 text-sm">이미지 없음</span>
              </div>
            )}
          </div>

          <div className="p-4">
            {amenities.length > 0 && (
              <div className="flex gap-2 mb-2">
                {amenities
                  .filter((a) => a in AMENITY_ICONS)
                  .map((amenity) => {
                    const Icon = AMENITY_ICONS[amenity];
                    return (
                      <div
                        key={amenity}
                        className="w-6 h-6 bg-teal-50 rounded flex items-center justify-center"
                        title={amenity}
                      >
                        <Icon className="w-4 h-4 text-teal-600" />
                      </div>
                    );
                  })}
              </div>
            )}

            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">{title}</h3>

            <p className="text-lg font-bold text-gray-900 mb-3">
              {price != null ? `₱${price.toLocaleString()}` : "가격 협의"}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{displayLocation ?? "위치 미정"}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{likeCount}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>

      <button
        type="button"
        onClick={handleLike}
        className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors z-10"
        aria-label={isLiked ? "찜 취소" : "찜하기"}
      >
        <Heart
          className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-700"}`}
        />
      </button>
    </div>
  );
}
