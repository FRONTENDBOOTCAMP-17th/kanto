"use client";

// 진행 중 모임 목록 — 데스크톱: 왼쪽 슬라이드, 모바일: 하단 시트

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Search, MapPin, Users, Clock } from "lucide-react";
import { TOPIC_META } from "@/constants/meetupTopics";
import type { Meetup } from "@/type/go";

interface MeetupListPanelProps {
  meetups: Meetup[];
  selectedId: number | null;
  onSelect: (meetup: Meetup) => void;
  onClose: () => void;
  enterAnim?: "up" | "left"; // 모바일 진입 방향: 최초 열기=아래에서, 상세에서 복귀=왼쪽에서
}

export function MeetupListPanel({
  meetups,
  selectedId,
  onSelect,
  onClose,
  enterAnim = "up",
}: MeetupListPanelProps) {
  const t = useTranslations("Go");
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? meetups.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()))
    : meetups;

  return (
    <div
      className={`fixed bottom-0 left-0 top-15 md:top-27.25 flex w-75 max-w-full flex-col bg-white shadow-[8px_0_36px_rgba(0,0,0,0.12)] md:animate-[slideInLeft_.28s_cubic-bezier(.4,0,.2,1)] lg:w-85 max-md:top-auto max-md:right-0 max-md:h-[85vh] max-md:w-full max-md:rounded-t-2xl ${
        enterAnim === "left"
          ? "max-md:animate-[slideInLeft_.28s_cubic-bezier(.4,0,.2,1)]"
          : "max-md:animate-[slideInUp_.28s_cubic-bezier(.4,0,.2,1)]"
      }`}
      style={{ zIndex: 41 }}
    >
      {/* 모바일 드래그 핸들 */}
      <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-slate-300 md:hidden" />

      {/* 헤더 */}
      <div className="shrink-0 border-b border-slate-100 px-6 py-5 max-md:pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
              {t("list.title")}
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-bold text-emerald-600">
              {t("list.inProgress", { count: meetups.length })}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label={t("list.close")}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        {/* 검색창 */}
        <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <Search
            className="h-3.75 w-3.75 shrink-0 text-slate-400"
            strokeWidth={2}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("list.searchPlaceholder")}
            className="w-full bg-transparent text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="shrink-0 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
            <MapPin className="h-8 w-8 opacity-40" strokeWidth={1.5} />
            <p className="text-[14px]">
              {query ? t("list.noResults") : t("list.empty")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {filtered.map((meetup) => {
              const meta = TOPIC_META[meetup.topic] ?? TOPIC_META.other;
              const isSelected = selectedId === meetup.post_id;
              const startDate = new Date(meetup.start_at);
              const endDate = new Date(meetup.end_at);
              const timeRange = `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")} ~ ${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
              const totalCount = meetup.participant_count + 1;
              const isFull = totalCount >= meetup.max_participants;

              return (
                <li key={meetup.post_id}>
                  <button
                    onClick={() => onSelect(meetup)}
                    className="w-full px-5 py-4 text-left transition-colors hover:bg-slate-50"
                    style={{
                      background: isSelected ? `${meta.bg}` : undefined,
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                        style={{
                          background: meta.bg,
                          color: meta.color,
                          border: `1px solid ${meta.border}`,
                        }}
                      >
                        {t(`topics.${meetup.topic}`)}
                      </span>
                      {isFull && (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-500">
                          {t("list.full")}
                        </span>
                      )}
                    </div>
                    <p className="mb-1.5 text-[14.5px] font-bold leading-snug text-slate-900 line-clamp-1">
                      {meetup.title}
                    </p>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
                        <MapPin
                          className="h-3.5 w-3.5 shrink-0 text-slate-400"
                          strokeWidth={2}
                        />
                        <span className="line-clamp-1">
                          {meetup.location_address}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
                          <Clock
                            className="h-3.5 w-3.5 shrink-0 text-slate-400"
                            strokeWidth={2}
                          />
                          <span>{timeRange}</span>
                        </div>
                        <div
                          className="flex items-center gap-1 text-[12.5px] font-semibold"
                          style={{ color: isFull ? "#ef4444" : "#14b8a6" }}
                        >
                          <Users className="h-3.5 w-3.5" strokeWidth={2} />
                          <span>
                            {totalCount}/{meetup.max_participants}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
