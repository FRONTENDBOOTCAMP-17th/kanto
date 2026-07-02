"use client";

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
import { getMyJoinedMeetupIds } from "@/services/go/go";
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

const MANILA_CENTER = { lat: 14.5547, lng: 121.0244 };
const MAP_ID = "kanto-go-map";

const PH_BOUNDS = { north: 21.2, south: 4.6, west: 116.9, east: 126.6 };

const CLUSTER_PX = 46;
const SPREAD_ZOOM = 18;

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
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[13px] border border-black/8 bg-white/92 shadow-md backdrop-blur-md transition-colors hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600"
      onClick={handleRecenter}
    >
      <Crosshair className="h-5 w-5 text-slate-900" strokeWidth={2} />
    </button>
  );
}

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

    if ((map.getZoom() ?? 12) < 16) map.setZoom(16);

    if (window.innerWidth >= 768) {
      const panelWidth = window.innerWidth >= 1024 ? 390 : 340;
      map.panBy(panelWidth / 2, 0);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, meetup?.post_id, active]);

  return null;
}

export default function GoClient({ initialMeetups }: { initialMeetups: Meetup[] }) {
  const t = useTranslations("Go");
  const [topicFilter, setTopicFilter] = useState<MeetupTopicKey | "all">("all");
  const [selectedMeetupId, setSelectedMeetupId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  // 생성 모달 닫힘 애니메이션 중에도 모달을 유지하기 위한 상태
  const [createClosing, setCreateClosing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  // "all" = 모임 진행중, "mine" = 내 모임, null = 닫힘
  const [listMode, setListMode] = useState<"all" | "mine" | null>(null);
  // 닫힘 애니메이션 중에도 패널을 유지하기 위한 렌더 상태
  const [renderListMode, setRenderListMode] = useState<"all" | "mine" | null>(null);
  const [listClosing, setListClosing] = useState(false);
  const [joinedMeetupIds, setJoinedMeetupIds] = useState<number[]>([]);
  const [detailListMode, setDetailListMode] = useState<"all" | "mine">("all");
  const [listEnterAnim, setListEnterAnim] = useState<"up" | "left">("up");
  const [detailFromList, setDetailFromList] = useState(false);
  const [zoom, setZoom] = useState(12);
  const [isMobile, setIsMobile] = useState(false);
  const [uiVisible, setUiVisible] = useState(false);
  const [shiftButtons, setShiftButtons] = useState(false);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const setDetailOpen = useGoUiStore((s) => s.setDetailOpen);
  const setListOpen = useGoUiStore((s) => s.setListOpen);

  const [bounds, setBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  const { meetups, allMeetups, loading } = useLiveMeetups({ topicFilter, initialData: initialMeetups });

  const hostedMeetups = useMemo(
    () => allMeetups.filter((m) => m.host_id === currentUserId),
    [allMeetups, currentUserId],
  );

  const joinedMeetups = useMemo(
    () =>
      allMeetups.filter(
        (m) =>
          m.host_id !== currentUserId &&
          joinedMeetupIds.includes(m.post_id),
      ),
    [allMeetups, currentUserId, joinedMeetupIds],
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setUiVisible(true), 400);
    return () => clearTimeout(id);
  }, []);

  // listMode가 바뀔 때: 전환이면 즉시 교체, 닫힘이면 애니메이션 후 언마운트
  if (listMode !== null && listMode !== renderListMode) {
    // 열기 or 전환 — 애니메이션 없이 즉시 내용 교체
    setRenderListMode(listMode);
    setListClosing(false);
    setShiftButtons(true);
  } else if (listMode === null && renderListMode !== null && !listClosing) {
    // 닫기 시작 — 닫힘 애니메이션 트리거
    setListClosing(true);
    setShiftButtons(false);
  }

  useEffect(() => {
    if (!listClosing) return;
    const id = setTimeout(() => {
      setRenderListMode(null);
      setListClosing(false);
    }, 280);
    return () => clearTimeout(id);
  }, [listClosing]);

  useEffect(() => {
    setDetailOpen(selectedMeetupId !== null);
    return () => setDetailOpen(false);
  }, [selectedMeetupId, setDetailOpen]);

  useEffect(() => {
    setListOpen(listMode !== null);
    return () => setListOpen(false);
  }, [listMode, setListOpen]);

  const activeTopics =
    loading || !bounds
      ? null
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

  const selectedMeetup =
    meetups.find((m) => m.post_id === selectedMeetupId) ?? null;
  const mobileSheetOpen = renderListMode !== null || selectedMeetupId !== null;

  const handlePinClick = (meetup: Meetup) => {
    setDetailFromList(false);
    setSelectedMeetupId((prev) =>
      prev === meetup.post_id ? null : meetup.post_id,
    );
  };

  const handleSelectFromList = (meetup: Meetup) => {
    setDetailFromList(true);
    setDetailListMode("all");
    setSelectedMeetupId(meetup.post_id);
    if (isMobile) setListMode(null);
  };

  const handleSelectFromMyList = (meetup: Meetup) => {
    setDetailFromList(true);
    setDetailListMode("mine");
    setSelectedMeetupId(meetup.post_id);
    if (isMobile) setListMode(null);
  };

  const handleBackToList = () => {
    setSelectedMeetupId(null);
    setDetailFromList(false);
    setListEnterAnim("left");
    setListMode(detailListMode === "mine" ? "mine" : "all");
  };

  const handleCloseDetail = () => {
    setSelectedMeetupId(null);
    setDetailFromList(false);
  };

  const toggleList = () => {
    if (listMode === "all") {
      setListMode(null);
    } else {
      setListEnterAnim("up");
      setListMode("all");
    }
  };

  const toggleMyMeetups = async () => {
    if (!currentUserId) {
      setShowLoginModal(true);
      return;
    }
    if (listMode === "mine") {
      setListMode(null);
      return;
    }
    setListMode("mine");
    const ids = await getMyJoinedMeetupIds();
    setJoinedMeetupIds(ids);
  };

  // 닫힘 애니메이션이 끝난 뒤 언마운트
  const closeCreate = () => {
    if (createClosing) return;
    setCreateClosing(true);
    setTimeout(() => {
      setShowCreate(false);
      setCreateClosing(false);
    }, 300);
  };

  const handleCreated = () => {
    closeCreate();
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div className="relative h-[calc(100vh-48px)] overflow-hidden md:h-[calc(100vh-109px)]">
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
            setListMode(null);
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

        <MapPanController meetup={selectedMeetup} active={detailFromList} />

        <div
          className={`pointer-events-none absolute right-0 top-0 z-10 pt-3.5 left-0 ${
            shiftButtons ? "md:left-75 lg:left-85" : ""
          } ${uiVisible ? "opacity-100" : "opacity-0"}`}
          style={{ transition: "left 280ms cubic-bezier(.4,0,.2,1), opacity 500ms" }}
        >
          <div className="pointer-events-auto relative flex min-w-0 items-start px-5">
            <div className="min-w-0 w-full max-w-full">
              <TopicFilterChips
                value={topicFilter}
                onChange={setTopicFilter}
                activeTopics={activeTopics}
              />
            </div>
          </div>
        </div>

        <div
          className={`absolute left-5 z-10 flex flex-col gap-2 top-[56px] md:top-18 ${
            shiftButtons ? "md:left-80 lg:left-90" : ""
          } ${uiVisible ? "opacity-100" : "opacity-0"} ${mobileSheetOpen ? "max-md:opacity-0 max-md:pointer-events-none" : ""}`}
          style={{ transition: "left 280ms cubic-bezier(.4,0,.2,1), opacity 280ms" }}
        >
          <button
            onClick={toggleList}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.75 max-md:px-3 max-md:py-1.25 backdrop-blur-md transition-colors hover:bg-slate-900/90 ${
              listMode === "all" ? "bg-slate-900" : "bg-slate-900/78"
            }`}
          >
            <Zap className="h-3 w-3 max-md:h-2.5 max-md:w-2.5 text-emerald-400" strokeWidth={2.5} />
            <span className="text-[13px] max-md:text-[11.5px] font-semibold text-white">
              {t("map.inProgress", { count: meetups.length })}
            </span>
          </button>
          <button
            onClick={toggleMyMeetups}
            className={`flex cursor-pointer items-center gap-1.5 self-start rounded-full px-3.5 py-1.75 max-md:px-3 max-md:py-1.25 backdrop-blur-md transition-colors hover:bg-slate-700/90 ${
              listMode === "mine" ? "bg-teal-600" : "bg-slate-900/78"
            }`}
          >
            <span className="text-[13px] max-md:text-[11.5px] font-semibold text-white">
              {t("map.myMeetups")}
            </span>
          </button>
        </div>

        <div
          className={`absolute bottom-7 z-10 left-5 ${
            shiftButtons ? "md:left-80 lg:left-90" : ""
          }`}
          style={{ transition: "left 280ms cubic-bezier(.4,0,.2,1)" }}
        >
          <RecenterButton />
        </div>

        <button
          onClick={() => currentUserId ? setShowCreate(true) : setShowLoginModal(true)}
          className={`md:hidden absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 flex cursor-pointer items-center justify-center pb-2 w-24 h-14 rounded-t-lg bg-slate-900/78 backdrop-blur-md hover:bg-slate-900/90 ${uiVisible ? "opacity-100" : "opacity-0"}`}
          style={{ transition: "opacity 500ms" }}
        >
          <Plus className="h-5 w-5 text-white" strokeWidth={4} />
        </button>

        {renderListMode !== null && (
          <MeetupListPanel
            meetups={meetups}
            mode={renderListMode}
            hostedMeetups={hostedMeetups}
            joinedMeetups={joinedMeetups}
            selectedId={selectedMeetupId}
            onSelect={renderListMode === "all" ? handleSelectFromList : handleSelectFromMyList}
            onClose={() => setListMode(null)}
            onCreateClick={() => currentUserId ? setShowCreate(true) : setShowLoginModal(true)}
            enterAnim={listEnterAnim}
            isClosing={listClosing}
          />
        )}

        <MeetupDetailPanel
          meetup={selectedMeetup}
          onClose={handleCloseDetail}
          onBackToList={detailFromList ? handleBackToList : undefined}
          currentUserId={currentUserId}
          suppressOverlay={listMode !== null}
        />

        {showCreate && (
          <MeetupCreateModal
            onClose={closeCreate}
            onCreated={handleCreated}
            isClosing={createClosing}
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
