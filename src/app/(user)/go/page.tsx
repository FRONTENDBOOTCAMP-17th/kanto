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
      className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-black/8 bg-white/92 shadow-md backdrop-blur-md transition-colors hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600"
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

export default function GoPage() {
  const t = useTranslations("Go");
  const [topicFilter, setTopicFilter] = useState<MeetupTopicKey | "all">("all");
  const [selectedMeetupId, setSelectedMeetupId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showMyMeetups, setShowMyMeetups] = useState(false);
  const [joinedMeetupIds, setJoinedMeetupIds] = useState<number[]>([]);
  const [detailListMode, setDetailListMode] = useState<"all" | "mine">("all");
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
    setDetailOpen(selectedMeetupId !== null);
    return () => setDetailOpen(false);
  }, [selectedMeetupId, setDetailOpen]);

  useEffect(() => {
    setListOpen(showList || showMyMeetups);
    return () => setListOpen(false);
  }, [showList, showMyMeetups, setListOpen]);

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
  const mobileSheetOpen = showList || showMyMeetups || selectedMeetupId !== null;

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
    if (isMobile) setShowList(false);
  };

  const handleSelectFromMyList = (meetup: Meetup) => {
    setDetailFromList(true);
    setDetailListMode("mine");
    setSelectedMeetupId(meetup.post_id);
    if (isMobile) setShowMyMeetups(false);
  };

  const handleBackToList = () => {
    setSelectedMeetupId(null);
    setDetailFromList(false);
    setListEnterAnim("left");
    if (detailListMode === "mine") {
      setShowMyMeetups(true);
    } else {
      setShowList(true);
    }
  };

  const handleCloseDetail = () => {
    setSelectedMeetupId(null);
    setDetailFromList(false);
  };

  const toggleList = () => {
    if (!showList) {
      setListEnterAnim("up");
      setShowMyMeetups(false);
    }
    setShowList((prev) => !prev);
  };

  const toggleMyMeetups = async () => {
    if (!currentUserId) {
      setShowLoginModal(true);
      return;
    }
    if (showMyMeetups) {
      setShowMyMeetups(false);
      return;
    }
    setShowList(false);
    setShowMyMeetups(true);
    const ids = await getMyJoinedMeetupIds();
    setJoinedMeetupIds(ids);
  };

  const handleCreated = () => {
    setShowCreate(false);
    
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
          className={`pointer-events-none absolute right-0 top-0 z-10 pt-3.5 left-0 transition-[left] duration-280 ease-in-out ${
            showList || showMyMeetups ? "md:left-75 lg:left-85" : ""
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


        <div
          className={`absolute left-5 z-10 flex flex-col gap-2 transition-[top] md:top-18 ${
            mobileSheetOpen ? "top-[calc(15vh+4px)]" : "top-20"
          }`}
        >
          <button
            onClick={toggleList}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.75 backdrop-blur-md transition-colors hover:bg-slate-900/90 ${
              showList ? "bg-slate-900" : "bg-slate-900/78"
            }`}
          >
            <Zap className="h-3 w-3 text-emerald-400" strokeWidth={2.5} />
            <span className="text-[13px] font-semibold text-white">
              {loading
                ? t("map.loading")
                : t("map.inProgress", { count: meetups.length })}
            </span>
          </button>
          <button
            onClick={toggleMyMeetups}
            className={`flex items-center gap-1.5 self-start rounded-full px-3.5 py-1.75 backdrop-blur-md transition-colors hover:bg-slate-700/90 ${
              showMyMeetups ? "bg-teal-600" : "bg-slate-900/78"
            }`}
          >
            <span className="text-[13px] font-semibold text-white">
              {t("map.myMeetups")}
            </span>
          </button>
        </div>


        <div
          className={`absolute bottom-7 z-10 left-5 transition-[left] duration-280 ease-in-out ${
            showList || showMyMeetups ? "md:left-80 lg:left-90" : ""
          }`}
        >
          <RecenterButton />
        </div>

        {showList && (
          <MeetupListPanel
            meetups={meetups}
            selectedId={selectedMeetupId}
            onSelect={handleSelectFromList}
            onClose={() => setShowList(false)}
            enterAnim={listEnterAnim}
          />
        )}

        {showMyMeetups && (
          <MeetupListPanel
            meetups={[]}
            mode="mine"
            hostedMeetups={hostedMeetups}
            joinedMeetups={joinedMeetups}
            selectedId={selectedMeetupId}
            onSelect={handleSelectFromMyList}
            onClose={() => setShowMyMeetups(false)}
            enterAnim="up"
          />
        )}

        <MeetupDetailPanel
          meetup={selectedMeetup}
          onClose={handleCloseDetail}
          onBackToList={detailFromList ? handleBackToList : undefined}
          currentUserId={currentUserId}
          suppressOverlay={showList || showMyMeetups}
        />

        
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
