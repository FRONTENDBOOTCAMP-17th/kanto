"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Clock,
  Wifi,
  AirVent,
  Car,
  Utensils,
  Heart,
  ChevronDown,
  ArrowRight,
  X,
} from "lucide-react";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { Pagination } from "@/components/common/Pagination";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { supabase } from "@/lib/supabase";
import { TRADE_LOCATIONS } from "@/type/location";
import { RENTAL_ROOM_TYPES } from "@/type/rental";
import type { RentalWithPost } from "@/type/rental";

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

const LOCATION_OPTIONS = [
  { id: "all", label: "전체 지역" },
  ...TRADE_LOCATIONS.map((loc) => ({ id: loc, label: loc })),
];

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
  const [items, setItems] = useState<RentalItem[]>(() => {
    const likedSet = new Set(initialLikedIds);
    return initialPosts.map((post) => formatRentalItem(post, likedSet));
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [mobileLocationOpen, setMobileLocationOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState<
    Record<number, number>
  >({});

  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const categoryBtnRef = useRef<HTMLDivElement>(null);
  const mobileCategoryBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      if (!session) return;
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", session.user.id)
        .single();
      if (userData) setCurrentUserId(userData.id);
    };
    initSession();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(e.target as Node)
      ) {
        setLocationDropdownOpen(false);
      }
      const inDesktop = categoryBtnRef.current?.contains(e.target as Node);
      const inMobile = mobileCategoryBtnRef.current?.contains(e.target as Node);
      if (!inDesktop && !inMobile) setCategoryDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileLocationOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileLocationOpen]);

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

  const selectedLocationLabel =
    LOCATION_OPTIONS.find((loc) => loc.id === locationFilter)?.label ??
    "전체 지역";
  const selectedRoomTypeLabel =
    RENTAL_ROOM_TYPES.find((rt) => rt.id === roomTypeFilter)?.label ?? "전체";

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

        <div className="mb-8">
          <form onSubmit={handleSearch}>
            <div className="md:hidden space-y-2">
              <button
                type="button"
                onClick={() => setMobileLocationOpen(true)}
                className={`flex items-center gap-1.5 h-11 px-4 rounded-full border-2 transition-colors font-semibold text-sm whitespace-nowrap ${
                  locationFilter !== "all"
                    ? "border-teal-400 bg-teal-50 text-teal-700"
                    : "border-gray-200 bg-white text-gray-800"
                }`}
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{selectedLocationLabel}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <div className="flex items-center bg-white border-2 border-gray-200 rounded-full h-11 px-2 focus-within:border-teal-400 transition-colors">
                <div
                  className="relative flex-shrink-0"
                  ref={mobileCategoryBtnRef}
                >
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen((v) => !v)}
                    className="flex items-center gap-1 px-3 h-8 rounded-full font-semibold text-gray-800 hover:bg-gray-100 transition-colors whitespace-nowrap text-sm select-none"
                  >
                    {selectedRoomTypeLabel}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${categoryDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {categoryDropdownOpen && (
                    <div
                      className="fixed mt-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-[100]"
                      style={{
                        top: mobileCategoryBtnRef.current
                          ? mobileCategoryBtnRef.current.getBoundingClientRect()
                              .bottom + 8
                          : 0,
                        left: mobileCategoryBtnRef.current
                          ? mobileCategoryBtnRef.current.getBoundingClientRect()
                              .left
                          : 0,
                      }}
                    >
                      {RENTAL_ROOM_TYPES.map((rt) => (
                        <button
                          key={rt.id}
                          type="button"
                          onClick={() => {
                            setRoomTypeFilter(rt.id);
                            setCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-5 py-2.5 text-sm transition-colors hover:bg-teal-50 hover:text-teal-600 ${roomTypeFilter === rt.id ? "bg-teal-50 text-teal-600 font-semibold" : "text-gray-700"}`}
                        >
                          {rt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="검색어를 입력해주세요"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="min-w-0 flex-1 h-full bg-transparent outline-none text-gray-700 placeholder-gray-400 px-2 text-sm"
                />
                <button
                  type="submit"
                  className="flex-shrink-0 w-7 h-7 bg-gray-800 hover:bg-teal-500 rounded-full flex items-center justify-center transition-colors mr-0.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            <div className="hidden md:flex items-center bg-white border-2 border-gray-200 rounded-full h-12 px-2 focus-within:border-teal-400 transition-colors max-w-lg mx-auto">
              <div className="relative flex-shrink-0" ref={locationDropdownRef}>
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen((v) => !v)}
                  className={`flex items-center gap-1 px-3 h-8 rounded-full font-semibold text-sm whitespace-nowrap transition-colors select-none ${
                    locationFilter !== "all"
                      ? "text-teal-700"
                      : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{selectedLocationLabel}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${locationDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {locationDropdownOpen && (
                  <div
                    className="fixed mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-[100]"
                    style={{
                      top: locationDropdownRef.current
                        ? locationDropdownRef.current.getBoundingClientRect()
                            .bottom + 8
                        : 0,
                      left: locationDropdownRef.current
                        ? locationDropdownRef.current.getBoundingClientRect()
                            .left
                        : 0,
                    }}
                  >
                    {LOCATION_OPTIONS.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          setLocationFilter(loc.id);
                          setLocationDropdownOpen(false);
                        }}
                        className={`w-full text-left px-5 py-2.5 text-sm transition-colors hover:bg-teal-50 hover:text-teal-600 ${locationFilter === loc.id ? "bg-teal-50 text-teal-600 font-semibold" : "text-gray-700"}`}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0" />
              <div className="relative flex-shrink-0" ref={categoryBtnRef}>
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen((v) => !v)}
                  className="flex items-center gap-1 px-3 h-8 rounded-full font-semibold text-gray-800 hover:bg-gray-100 transition-colors whitespace-nowrap text-sm select-none"
                >
                  {selectedRoomTypeLabel}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${categoryDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {categoryDropdownOpen && (
                  <div
                    className="fixed mt-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-[100]"
                    style={{
                      top: categoryBtnRef.current
                        ? categoryBtnRef.current.getBoundingClientRect()
                            .bottom + 8
                        : 0,
                      left: categoryBtnRef.current
                        ? categoryBtnRef.current.getBoundingClientRect().left
                        : 0,
                    }}
                  >
                    {RENTAL_ROOM_TYPES.map((rt) => (
                      <button
                        key={rt.id}
                        type="button"
                        onClick={() => {
                          setRoomTypeFilter(rt.id);
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-5 py-2.5 text-sm transition-colors hover:bg-teal-50 hover:text-teal-600 ${roomTypeFilter === rt.id ? "bg-teal-50 text-teal-600 font-semibold" : "text-gray-700"}`}
                      >
                        {rt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0" />
              <input
                type="text"
                placeholder="검색어를 입력해주세요"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="min-w-0 flex-1 h-full bg-transparent outline-none text-gray-700 placeholder-gray-400 px-2 text-sm"
              />
              <button
                type="submit"
                className="flex-shrink-0 w-8 h-8 bg-gray-800 hover:bg-teal-500 rounded-full flex items-center justify-center transition-colors mr-0.5"
              >
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>
        </div>

        <div className="border-t border-gray-200 mb-8" />

        {mobileLocationOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileLocationOpen(false)}
            />
            <div className="relative bg-white rounded-t-3xl w-full pb-8">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <span className="font-bold text-gray-900 text-lg">
                  지역 선택
                </span>
                <button
                  type="button"
                  onClick={() => setMobileLocationOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="px-4 py-3">
                {LOCATION_OPTIONS.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setLocationFilter(loc.id);
                      setMobileLocationOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl mb-2 transition-colors ${
                      locationFilter === loc.id
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`text-base ${locationFilter === loc.id ? "font-semibold" : ""}`}
                    >
                      {loc.label}
                    </span>
                    {locationFilter === loc.id && (
                      <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 12 12"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
                  <div key={item.id} className="relative">
                    <Link href={`/rental/${item.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                        <div className="relative aspect-square overflow-hidden bg-gray-100">
                          {item.images.length > 0 ? (
                            <>
                              {item.images.map((image, idx) => (
                                <div
                                  key={idx}
                                  className={`absolute inset-0 transition-opacity duration-300 ${
                                    idx === currentIndex
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                >
                                  <ImageWithFallback
                                    src={image}
                                    alt={`${item.title} ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 25vw"
                                  />
                                </div>
                              ))}
                              {item.images.length > 1 && (
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                  {item.images.map((_, idx) => (
                                    <button
                                      key={idx}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        goToSlide(item.id, idx);
                                      }}
                                      className={`h-1.5 rounded-full transition-all ${
                                        idx === currentIndex
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
                              <span className="text-gray-400 text-sm">
                                이미지 없음
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          {item.amenities.length > 0 && (
                            <div className="flex gap-2 mb-2">
                              {item.amenities
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

                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                            {item.title}
                          </h3>

                          <p className="text-lg font-bold text-gray-900 mb-3">
                            {item.price != null
                              ? `₱${item.price.toLocaleString()}`
                              : "가격 협의"}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {displayLocation ?? "위치 미정"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(item.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              <span>{item.likeCount}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLikeToggle(item.id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors z-10"
                      aria-label={item.isLiked ? "찜 취소" : "찜하기"}
                    >
                      <Heart
                        className={`w-4 h-4 ${item.isLiked ? "fill-red-500 text-red-500" : "text-gray-700"}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {totalPage > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPage={totalPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
}
