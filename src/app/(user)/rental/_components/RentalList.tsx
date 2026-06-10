"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RentalCard } from "./RentalCard";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import type { RentalWithPost } from "@/type/rental";

interface Props {
  initialPosts: RentalWithPost[];
  initialLikedIds: number[];
}

export function RentalList({ initialPosts, initialLikedIds }: Props) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const likedSet = new Set(initialLikedIds);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) setCurrentUserId(data.id);
        });
    });
  }, []);

  if (initialPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
        <p className="text-lg font-medium">등록된 매물이 없습니다</p>
        <p className="text-sm">첫 번째 매물을 등록해보세요!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              onLoginRequired={() => setShowLoginModal(true)}
            />
          );
        })}
      </div>
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
