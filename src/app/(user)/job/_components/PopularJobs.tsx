"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MapPin, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { LikeButton } from "@/components/common/LikeButton";
import type { JobWithPost } from "@/type/job/jobList";

interface Props {
  posts: JobWithPost[];
  likedIds: number[];
}

interface CardProps {
  post: JobWithPost;
  initialIsLiked: boolean;
}

function PopularJobCard({ post, initialIsLiked }: CardProps) {
  const job = post.jobs?.[0];
  if (!job) return null;

  return (
    <Link
      href={`/job/${post.id}`}
      className="shrink-0 flex flex-col justify-between gap-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl p-4 hover:shadow-sm transition-all w-[calc(50%-6px)] sm:w-[calc(33.33%-8px)] lg:w-[calc(20%-10px)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{post.title}</p>
          <p className="text-xs text-gray-500 truncate">{job.company_name}</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="shrink-0">
          <LikeButton postId={post.id} initialIsLiked={initialIsLiked} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-1">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-teal-600">
            ₱ {job.salary.toLocaleString()}
            {job.salary_type && (
              <span className="text-gray-400 font-normal ml-1">/ {job.salary_type}</span>
            )}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{job.location_custom ?? job.location_type}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PopularJobs({ posts, likedIds }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const likedSet = new Set(likedIds);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollState]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("a") as HTMLElement | null;
    if (!card) return;
    const amount = card.offsetWidth + 12;
    el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  if (posts.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-1.5 mb-3">
        <h2 className="text-xl font-black text-gray-700">인기 공고</h2>
        <TrendingUp className="w-6 h-6 -mb-2 text-teal-500" />
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="hidden cursor-pointer md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="이전"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
          onScroll={updateScrollState}
        >
          {posts.map((post) => (
            <PopularJobCard
              key={post.id}
              post={post}
              initialIsLiked={likedSet.has(post.id)}
            />
          ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="hidden cursor-pointer md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="다음"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </section>
  );
}
