"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { TopicBadge } from "@/components/go/TopicBadge";
import { formatManilaTimeRange } from "@/utils/goTime";
import { getActiveMeetups } from "@/services/go/go";
import type { Meetup } from "@/type/go";

const CARD_WIDTH = 256;
const GAP = 12;
const STEP = CARD_WIDTH + GAP;
const PAGE_SIZE = 6;
const PREFETCH_THRESHOLD = 4;

export default function MeetupCarousel({ meetups }: { meetups: Meetup[] }) {
  const t = useTranslations("Main");
  const tg = useTranslations("Go");
  const [items, setItems] = useState(meetups);
  const [index, setIndex] = useState(0);
  const [exhausted, setExhausted] = useState(meetups.length < PAGE_SIZE);
  const fetchingRef = useRef(false);
  const hasControls = items.length > 1 || !exhausted;

  // 마지막 카드에 닿기 전에 미리 다음 묶음을 불러와, 사용자가 실제로 넘길 때는
  // 이미 준비된 데이터로 끊김 없이 이어지도록 한다.
  useEffect(() => {
    if (exhausted || fetchingRef.current) return;
    if (index < items.length - PREFETCH_THRESHOLD) return;

    fetchingRef.current = true;
    getActiveMeetups({ offset: items.length, limit: PAGE_SIZE })
      .then((more) => {
        if (more.length === 0) {
          setExhausted(true);
        } else {
          setItems((prev) => [...prev, ...more]);
          if (more.length < PAGE_SIZE) setExhausted(true);
        }
      })
      .catch(() => setExhausted(true))
      .finally(() => {
        fetchingRef.current = false;
      });
  }, [index, items.length, exhausted]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i < items.length - 1) return i + 1;
      return exhausted ? 0 : i;
    });
  }, [items.length, exhausted]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  return (
    <div className="relative">
      <div className={`overflow-hidden ${hasControls ? "mx-9" : ""}`}>
        <div
          className="flex gap-3 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * STEP}px)` }}
        >
          {items.map((meetup) => (
            <Link
              key={meetup.post_id}
              href="/go"
              className="cursor-pointer shrink-0 w-64 rounded-2xl bg-white border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <TopicBadge
                topic={meetup.topic}
                label={tg(`topics.${meetup.topic}`)}
                bordered={false}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
              />
              <h3 className="mt-2 mb-1 text-sm font-semibold text-gray-900 line-clamp-1">
                {meetup.title}
              </h3>
              <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{meetup.location_address}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3 shrink-0" />
                <span>{formatManilaTimeRange(meetup.start_at, meetup.end_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {hasControls && (
        <>
          <button
            type="button"
            onClick={prev}
            className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-white hover:bg-gray-50 border border-gray-200 shadow rounded-full flex items-center justify-center text-gray-700 transition-colors"
            aria-label={t("prevSlide")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-white hover:bg-gray-50 border border-gray-200 shadow rounded-full flex items-center justify-center text-gray-700 transition-colors"
            aria-label={t("nextSlide")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
