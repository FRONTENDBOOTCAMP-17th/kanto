"use client";

import { useState } from "react";
import { formatTimeAgo } from "@/utils/formatTime";
import { Clock, Eye, Heart } from "lucide-react";
import { RentalWithPost } from "@/type/rental/rentalDetail";
import InteractionButtons from "@/components/common/InteractionButtons";

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
  const [likeCount, setLikeCount] = useState(rental.posts.like_count ?? 0);

  const handleLikeChange = (liked: boolean) =>
    setLikeCount((prev) => liked ? prev + 1 : Math.max(prev - 1, 0));

  return (
    <div className="mt-2 md:mt-4 border border-gray-200 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold">{rental.posts.title}</h1>
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
      <p className="text-gray-500 text-sm mt-1">
        {rental.room_type} · {rental.location_detail ?? rental.location}
      </p>

      <div className="text-gray-400 text-sm flex items-center gap-4 mt-3">
        <span className="flex items-center leading-none gap-1">
          <Clock className="w-4 h-4" />
          <time dateTime={rental.created_at}>{formatTimeAgo(rental.created_at)}</time>
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          조회수 : {rental.posts.view_count}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-4 h-4" />
          {likeCount}
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

      <hr className="border-gray-200 my-4" />

      <h2 className="text-xl font-semibold mb-3">숙소 설명</h2>
      <p className="text-gray-700 whitespace-pre-line">{rental.description}</p>
    </div>
  );
}
