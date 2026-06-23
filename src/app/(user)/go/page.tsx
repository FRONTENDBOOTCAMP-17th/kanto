"use client";

// 칸토 go! 지도 메인 페이지

import { useState } from "react";
import { APIProvider, Map, useMap, type MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { Plus, Crosshair, Zap } from "lucide-react";
import { useLiveMeetups } from "@/hooks/go/useLiveMeetups";
import { MeetupPin } from "@/components/go/MeetupPin";
import { MeetupDetailPanel } from "@/components/go/MeetupDetailPanel";
import { MeetupListPanel } from "@/components/go/MeetupListPanel";
import { MeetupCreateModal } from "@/components/go/MeetupCreateModal";
import { TopicFilterChips } from "@/components/go/TopicFilterChips";
import { useAuthStore } from "@/store/authStore";
import type { Meetup } from "@/type/go";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

// 마닐라 BGC/Makati 중심
const MANILA_CENTER = { lat: 14.5547, lng: 121.0244 };
const MAP_ID = "kanto-go-map";

function RecenterButton() {
  const map = useMap(MAP_ID);

  const handleRecenter = () => {
    if (!navigator.geolocation || !map) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      map.setZoom(15);
    });
  };

  return (
    <button
      className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-black/8 bg-white/92 shadow-md backdrop-blur-md hover:bg-white"
      onClick={handleRecenter}
    >
      <Crosshair className="h-5 w-5 text-slate-900" strokeWidth={2} />
    </button>
  );
}

export default function GoPage() {
  const [topicFilter, setTopicFilter] = useState<MeetupTopicKey | "all">("all");
  const [selectedMeetupId, setSelectedMeetupId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showList, setShowList] = useState(false);
  const currentUserId = useAuthStore((s) => s.user)?.id;

  const [bounds, setBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

  const { meetups, allMeetups, loading } = useLiveMeetups({ topicFilter });

  const activeTopics =
    loading || !bounds
      ? undefined
      : new Set(
          allMeetups
            .filter(
              (m) =>
                m.location_lat >= bounds.south &&
                m.location_lat <= bounds.north &&
                m.location_lng >= bounds.west &&
                m.location_lng <= bounds.east,
            )
            .map((m) => m.topic),
        );

  const handleBoundsChanged = (e: MapCameraChangedEvent) => setBounds(e.detail.bounds);

  // 실시간 목록과 동기화된 선택 모임 — 참여자 수/상태 변경이 패널에 즉시 반영됨
  const selectedMeetup = meetups.find((m) => m.post_id === selectedMeetupId) ?? null;

  const handlePinClick = (meetup: Meetup) => {
    setSelectedMeetupId((prev) => (prev === meetup.post_id ? null : meetup.post_id));
  };

  const handleCreated = (_postId: number) => {
    setShowCreate(false);
    // 생성된 모임은 Realtime 구독으로 자동 갱신됨
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      {/* 지도 전체 화면 (nav 60px 제외) */}
      <div className="relative overflow-hidden" style={{ height: "calc(100vh - 60px)" }}>

        {/* Google Maps */}
        <Map
          id={MAP_ID}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
          defaultCenter={MANILA_CENTER}
          defaultZoom={14}
          gestureHandling="greedy"
          zoomControl={true}
          mapTypeControl={false}
          disableDefaultUI={false}
          className="h-full w-full"
          onBoundsChanged={handleBoundsChanged}
          onClick={() => { setSelectedMeetupId(null); setShowList(false); }}
        >
          {meetups.map((m) => (
            <MeetupPin
              key={m.post_id}
              meetup={m}
              isSelected={selectedMeetup?.post_id === m.post_id}
              onClick={() => handlePinClick(m)}
            />
          ))}
        </Map>

        {/* ── 상단 오버레이: 필터 ── */}
        <div
          className="pointer-events-none absolute right-0 top-0 z-10 pt-3.5 transition-[left] duration-[280ms] ease-[cubic-bezier(.4,0,.2,1)]"
          style={{ left: showList ? 360 : 0 }}
        >
          <div className="pointer-events-auto flex items-center gap-3 px-5 flex-wrap">
            <TopicFilterChips value={topicFilter} onChange={setTopicFilter} activeTopics={activeTopics} />
          </div>
        </div>

        {/* ── 진행 중 카운트 필 (클릭 시 목록 사이드바 토글) ── */}
        <button
          onClick={() => setShowList((prev) => !prev)}
          className="absolute left-5 top-[72px] z-10 flex items-center gap-1.5 rounded-full bg-slate-900/78 px-3.5 py-[7px] backdrop-blur-md hover:bg-slate-900/90 transition-colors"
        >
          <Zap className="h-3 w-3 text-emerald-400" strokeWidth={2.5} />
          <span className="text-[13px] font-semibold text-white">
            {loading ? "..." : `${meetups.length}개 모임 진행 중`}
          </span>
        </button>

        {/* ── 우측 하단: FAB + 내 위치 ── */}
        <div className="absolute bottom-7 right-7 z-10 flex flex-col items-end gap-3">
          {/* 내 위치 버튼 */}
          <RecenterButton />

          {/* 번개모임 만들기 FAB */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-[16px] bg-slate-900 px-5 py-3.5 text-[14.5px] font-bold text-white shadow-[0_8px_28px_rgba(15,23,42,.4)] hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
            번개모임 만들기
          </button>
        </div>

        {/* ── 목록 패널 (왼쪽) ── */}
        {showList && (
          <MeetupListPanel
            meetups={meetups}
            selectedId={selectedMeetupId}
            onSelect={(meetup) => setSelectedMeetupId(meetup.post_id)}
            onClose={() => setShowList(false)}
          />
        )}

        {/* ── 상세 패널 (오른쪽) ── */}
        <MeetupDetailPanel
          meetup={selectedMeetup}
          onClose={() => setSelectedMeetupId(null)}
          currentUserId={currentUserId}
          suppressOverlay={showList}
        />

        {/* ── 생성 모달 ── */}
        {showCreate && (
          <MeetupCreateModal
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}
      </div>
    </APIProvider>
  );
}
