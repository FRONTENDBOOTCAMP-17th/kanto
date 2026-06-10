"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RentalCard } from "./RentalCard";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { supabase } from "@/lib/supabase";
import { RENTAL_ROOM_TYPES } from "@/type/rental/rentalList";
import type { RentalWithPost } from "@/type/rental/rentalList";

const AMENITY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  wifi: Wifi,
  aircon: AirVent,
  parking: Car,
  kitchen: Utensils,
};

const ITEMS_PER_PAGE = 12;

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

interface RentalItem {
  id: number;
  title: string;
  price: number | null;
  location: string | null;
  locationDetail: string | null;
  createdAt: string;
  images: string[];
  amenities: string[];
  likeCount: number;
  isLiked: boolean;
  roomType: string | null;
}

function formatRentalItem(
  post: RentalWithPost,
  likedSet: Set<number>,
): RentalItem {
  const rental = post.rentals?.[0];
  return {
    id: post.id,
    title: post.title,
    price: rental?.price ?? null,
    location: rental?.location ?? null,
    locationDetail: rental?.location_detail ?? null,
    createdAt: post.created_at,
    images: (rental?.images as string[] | null) ?? [],
    amenities: (rental?.amenities as string[] | null) ?? [],
    likeCount: post.like_count,
    isLiked: likedSet.has(post.id),
    roomType: rental?.room_type ?? null,
  };
}

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

  useEffect(() => {
    setCurrentPage(1);
  }, [roomTypeFilter, locationFilter, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleLikeToggle = async (id: number) => {
    if (!isLoggedIn || currentUserId === null) {
      setShowLoginModal(true);
      return;
    }
    const target = items.find((item) => item.id === id);
    if (!target) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isLiked: !item.isLiked,
              likeCount: item.likeCount + (item.isLiked ? -1 : 1),
            }
          : item,
      ),
    );

    if (target.isLiked) {
      await supabase
        .from("common_likes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("target_type", "post")
        .eq("target_id", id);
    } else {
      await supabase
        .from("common_likes")
        .insert({ user_id: currentUserId, target_type: "post", target_id: id });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchRoomType =
        roomTypeFilter === "all" || item.roomType === roomTypeFilter;
      const matchLocation =
        locationFilter === "all" || item.location === locationFilter;
      return matchSearch && matchRoomType && matchLocation;
    });
  }, [items, searchQuery, roomTypeFilter, locationFilter]);

  const totalPage = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const goToSlide = (id: number, idx: number) =>
    setCurrentImageIndex((prev) => ({ ...prev, [id]: idx }));

  return (
    <main className="flex-1 bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">방렌트</h1>
          <p className="text-gray-600 mt-1">
            {searchQuery
              ? `"${searchQuery}" 검색 결과`
              : "필리핀 한인을 위한 방 렌트 정보"}
          </p>
        </div>

        <SearchBar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearch}
          locationFilter={locationFilter}
          onLocationChange={(v) => { setLocationFilter(v); setCurrentPage(1); }}
        >
          <FilterDropdown
            options={RENTAL_ROOM_TYPES}
            value={roomTypeFilter}
            onChange={(v) => { setRoomTypeFilter(v); setCurrentPage(1); }}
          />
        </SearchBar>

        <div className="border-t border-gray-200 mb-8" />

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <p className="text-lg font-medium">등록된 매물이 없습니다</p>
            <p className="text-sm">첫 번째 매물을 등록해보세요!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {pagedItems.map((item) => {
                const currentIndex = currentImageIndex[item.id] ?? 0;
                const displayLocation =
                  item.location === "그 외 지역"
                    ? (item.locationDetail ?? item.location)
                    : item.location;

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
