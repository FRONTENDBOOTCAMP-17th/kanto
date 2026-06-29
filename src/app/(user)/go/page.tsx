"use client";

// 칸토 go! 지도 메인 페이지

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  APIProvider,
  Map,
  useMap,
  type MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import { Plus, Crosshair, Zap } from "lucide-react";
import { useLiveMeetups } from "@/hooks/go/useLiveMeetups";
import { MeetupPin, ClusterPin } from "@/components/go/MeetupPin";
import { MeetupDetailPanel } from "@/components/go/MeetupDetailPanel";
import { MeetupListPanel } from "@/components/go/MeetupListPanel";
import { MeetupCreateModal } from "@/components/go/MeetupCreateModal";
import { TopicFilterChips } from "@/components/go/TopicFilterChips";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { useAuthStore } from "@/store/authStore";
import { useGoUiStore } from "@/store/goUiStore";
import type { Meetup } from "@/type/go";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

// 마닐라 BGC/Makati 중심
const MANILA_CENTER = { lat: 14.5547, lng: 121.0244 };
const MAP_ID = "kanto-go-map";

// 필리핀 전역 — 이 경계 밖으로는 지도를 팬/줌 불가
const PH_BOUNDS = { north: 21.2, south: 4.6, west: 116.9, east: 126.6 };

// 클러스터링 파라미터
const CLUSTER_PX = 46; // 이 픽셀 거리 이내면 한 묶음
const SPREAD_ZOOM = 18; // 이 줌 이상이면 겹친(분리 불가) 핀을 원형으로 펼침

// 위경도 → Web Mercator 월드 좌표(타일 256px, zoom 0 기준)
function worldXY(lat: number, lng: number) {
  const s = Math.min(
    Math.max(Math.sin((lat * Math.PI) / 180), -0.9999),
    0.9999,
  );
  return {
    x: ((lng + 180) / 360) * 256,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256,
  };
}

function RecenterButton() {
  const t = useTranslations("Go.map");
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
      aria-label={t("myLocation")}
      className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-black/8 bg-white/92 shadow-md backdrop-blur-md transition-colors hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600"
      onClick={handleRecenter}
    >
      <Crosshair className="h-5 w-5 text-slate-900" strokeWidth={2} />
    </button>
  );
}

// 목록에서 선택한 모임의 핀 위치로 지도를 이동시킨다.
function MapPanController({
  meetup,
  active,
}: {
  meetup: Meetup | null;
  active: boolean;
}) {
  const map = useMap(MAP_ID);

  useEffect(() => {
    if (!map || !meetup || !active) return;

    map.panTo({ lat: meetup.location_lat, lng: meetup.location_lng });

    // 핀이 클러스터에 묶여 안 보일 수 있으므로 개별 핀이 드러나는 줌까지 확대
    if ((map.getZoom() ?? 12) < 16) map.setZoom(16);

    // 데스크톱: 우측 상세 패널 너비의 절반만큼 우측으로 panBy → 핀이 패널에 안 가린 채 보이는 영역 중앙에 옴
    if (window.innerWidth >= 768) {
      const panelWidth = window.innerWidth >= 1024 ? 390 : 340;
      map.panBy(panelWidth / 2, 0);
    }
    // 실시간 갱신(participant_count 변동)으로 인한 재이동을 막기 위해 post_id 기준으로만 트리거
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, meetup?.post_id, active]);

  return null;
}

export default function GoPage() {
  const t = useTranslations("Go");
  const [topicFilter, setTopicFilter] = useState<MeetupTopicKey | "all">("all");
  const [selectedMeetupId, setSelectedMeetupId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showList, setShowList] = useState(false);
  const [listEnterAnim, setListEnterAnim] = useState<"up" | "left">("up");
  const [detailFromList, setDetailFromList] = useState(false);
  const [zoom, setZoom] = useState(12);
  const [isMobile, setIsMobile] = useState(false);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const setDetailOpen = useGoUiStore((s) => s.setDetailOpen);
  const setListOpen = useGoUiStore((s) => s.setListOpen);

  const [bounds, setBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  const { meetups, allMeetups, loading } = useLiveMeetups({ topicFilter });

  // 모바일 여부 (목록 → 상세 네비게이션 분기)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // 패널 열림 상태를 전역에 반영 → 우측 하단 위젯 숨김
  useEffect(() => {
    setDetailOpen(selectedMeetupId !== null);
    return () => setDetailOpen(false);
  }, [selectedMeetupId, setDetailOpen]);

  useEffect(() => {
    setListOpen(showList);
    return () => setListOpen(false);
  }, [showList, setListOpen]);

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

  // 현재 줌에서 화면상 가까운(≈CLUSTER_PX) 모임을 묶는다. 줌이 커지면 자연히 분리됨.
  const clusters = useMemo(() => {
    const scale = Math.pow(2, zoom);
    const pts = meetups.map((m) => {
      const world = worldXY(m.location_lat, m.location_lng);
      return { m, px: world.x * scale, py: world.y * scale };
    });
    const buckets = new globalThis.Map<string, number[]>();
    pts.forEach((p, idx) => {
      const bx = Math.floor(p.px / CLUSTER_PX);
      const by = Math.floor(p.py / CLUSTER_PX);
      const key = `${bx}:${by}`;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(idx);
      else buckets.set(key, [idx]);
    });
    const used = new Array(pts.length).fill(false);
    const groups: Meetup[][] = [];
    for (let i = 0; i < pts.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      const group = [pts[i].m];
      const bx = Math.floor(pts[i].px / CLUSTER_PX);
      const by = Math.floor(pts[i].py / CLUSTER_PX);
      for (let x = bx - 1; x <= bx + 1; x++) {
        for (let y = by - 1; y <= by + 1; y++) {
          for (const j of buckets.get(`${x}:${y}`) ?? []) {
            if (j <= i || used[j]) continue;
            if (
              Math.hypot(pts[i].px - pts[j].px, pts[i].py - pts[j].py) <
              CLUSTER_PX
            ) {
              used[j] = true;
              group.push(pts[j].m);
            }
          }
        }
      }
      groups.push(group);
    }
    return groups;
  }, [meetups, zoom]);

  const handleCameraChanged = (e: MapCameraChangedEvent) => {
    setBounds(e.detail.bounds);
    setZoom(e.detail.zoom);
  };

  // 실시간 목록과 동기화된 선택 모임 — 참여자 수/상태 변경이 패널에 즉시 반영됨
  const selectedMeetup =
    meetups.find((m) => m.post_id === selectedMeetupId) ?? null;
  const mobileSheetOpen = showList || selectedMeetupId !== null;

  const handlePinClick = (meetup: Meetup) => {
    setDetailFromList(false);
    setSelectedMeetupId((prev) =>
      prev === meetup.post_id ? null : meetup.post_id,
    );
  };

  // 목록에서 모임 선택 — 모바일에선 목록을 닫고 상세로 "이동"(상세가 오른쪽에서 등장)
  const handleSelectFromList = (meetup: Meetup) => {
    setDetailFromList(true);
    setSelectedMeetupId(meetup.post_id);
    if (isMobile) setShowList(false);
  };

  // 상세에서 뒤로 — 모바일에서 목록으로 복귀(목록이 왼쪽에서 등장)
  const handleBackToList = () => {
    setSelectedMeetupId(null);
    setDetailFromList(false);
    setListEnterAnim("left");
    setShowList(true);
  };

  const handleCloseDetail = () => {
    setSelectedMeetupId(null);
    setDetailFromList(false);
  };

  const toggleList = () => {
    if (!showList) setListEnterAnim("up");
    setShowList((prev) => !prev);
  };

  const handleCreated = () => {
    setShowCreate(false);
    // 생성된 모임은 Realtime 구독으로 자동 갱신됨
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div className="relative h-[calc(100vh-48px)] overflow-hidden md:h-[calc(100vh-109px)]">
        {/* Google Maps */}
        <Map
          id={MAP_ID}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
          defaultCenter={MANILA_CENTER}
          defaultZoom={12}
          minZoom={5}
          restriction={{ latLngBounds: PH_BOUNDS, strictBounds: false }}
          gestureHandling="greedy"
          disableDefaultUI={true}
          zoomControl={false}
          className="h-full w-full"
          onCameraChanged={handleCameraChanged}
          onClick={() => {
            handleCloseDetail();
            setShowList(false);
          }}
        >
          {clusters.map((group) => {
            if (group.length === 1) {
              const m = group[0];
              return (
                <MeetupPin
                  key={m.post_id}
                  meetup={m}
                  isSelected={selectedMeetup?.post_id === m.post_id}
                  onClick={() => handlePinClick(m)}
                />
              );
            }
            // 고배율: 좌표가 (거의) 동일해 더 줌해도 안 갈라지는 핀들을 원형으로 펼침
            if (zoom >= SPREAD_ZOOM) {
              const cLat =
                group.reduce((s, m) => s + m.location_lat, 0) / group.length;
              const cLng =
                group.reduce((s, m) => s + m.location_lng, 0) / group.length;
              const R = 0.00022;
              const cosLat = Math.cos((cLat * Math.PI) / 180) || 1;
              return group.map((m, idx) => {
                const angle = (2 * Math.PI * idx) / group.length;
                return (
                  <MeetupPin
                    key={m.post_id}
                    meetup={{
                      ...m,
                      location_lat: cLat + R * Math.sin(angle),
                      location_lng: cLng + (R * Math.cos(angle)) / cosLat,
                    }}
                    isSelected={selectedMeetup?.post_id === m.post_id}
                    onClick={() => handlePinClick(m)}
                  />
                );
              });
            }
            return (
              <ClusterPin key={`cluster-${group[0].post_id}`} meetups={group} />
            );
          })}
        </Map>

        {/* 목록에서 선택 시 해당 핀으로 지도 이동 */}
        <MapPanController meetup={selectedMeetup} active={detailFromList} />

        {/* ── 상단 오버레이: 필터(좌) + 번개모임 만들기(우) ── */}
        <div
          className={`pointer-events-none absolute right-0 top-0 z-10 pt-3.5 left-0 transition-[left] duration-280 ease-in-out ${
            showList ? "md:left-75 lg:left-85" : ""
          }`}
        >
          <div className="pointer-events-auto relative flex min-w-0 items-start px-5 pr-18.5 md:pr-47.5">
            <div className="min-w-0 w-full max-w-full">
              <TopicFilterChips
                value={topicFilter}
                onChange={setTopicFilter}
                activeTopics={activeTopics}
              />
            </div>
            <button
              onClick={() =>
                currentUserId ? setShowCreate(true) : setShowLoginModal(true)
              }
              className="absolute right-5 top-0 flex shrink-0 items-center gap-2 rounded-[14px] bg-slate-900 px-4 py-2.5 text-[14px] font-bold text-white shadow-[0_6px_20px_rgba(15,23,42,.35)] transition-all hover:bg-slate-800 active:scale-95"
            >
              <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
              <span className="max-md:hidden">{t("map.createMeetup")}</span>
            </button>
          </div>
        </div>

        {/* ── 진행 중 카운트 필 (클릭 시 목록 사이드바 토글) ── */}
        <button
          onClick={toggleList}
          className={`absolute left-5 z-10 flex items-center gap-1.5 rounded-full bg-slate-900/78 px-3.5 py-1.75 backdrop-blur-md transition-[top,background-color] hover:bg-slate-900/90 md:top-18 ${
            mobileSheetOpen ? "top-[calc(15vh+4px)]" : "top-20"
          }`}
        >
          <Zap className="h-3 w-3 text-emerald-400" strokeWidth={2.5} />
          <span className="text-[13px] font-semibold text-white">
            {loading
              ? t("map.loading")
              : t("map.inProgress", { count: meetups.length })}
          </span>
        </button>

        {/* ── 내 위치 버튼 (좌측 하단, 목록 열리면 데스크톱에서 우측으로 이동) ── */}
        <div
          className={`absolute bottom-7 z-10 left-5 transition-[left] duration-280 ease-in-out ${
            showList ? "md:left-80 lg:left-90" : ""
          }`}
        >
          <RecenterButton />
        </div>

        {/* ── 목록 패널 (데스크톱 왼쪽 / 모바일 하단 시트) ── */}
        {showList && (
          <MeetupListPanel
            meetups={meetups}
            selectedId={selectedMeetupId}
            onSelect={handleSelectFromList}
            onClose={() => setShowList(false)}
            enterAnim={listEnterAnim}
          />
        )}

        {/* ── 상세 패널 (데스크톱 오른쪽 / 모바일 하단 시트, 목록에서 우측으로 이동) ── */}
        <MeetupDetailPanel
          meetup={selectedMeetup}
          onClose={handleCloseDetail}
          onBackToList={detailFromList ? handleBackToList : undefined}
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

        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    </APIProvider>
  );
}
