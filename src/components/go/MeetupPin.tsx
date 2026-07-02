"use client";

import { memo, useCallback } from "react";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";
import { TOPIC_META } from "@/constants/meetupTopics";
import type { Meetup } from "@/type/go";

const MAP_ID = "kanto-go-map";

interface MeetupPinProps {
  meetup: Meetup;
  isSelected: boolean;
  onClick: (meetup: Meetup) => void;
}

export const MeetupPin = memo(function MeetupPin({
  meetup,
  isSelected,
  onClick,
}: MeetupPinProps) {
  const t = useTranslations("Go.pin");
  const meta = TOPIC_META[meetup.topic] ?? TOPIC_META.other;
  const totalCount = meetup.participant_count + 1;
  const isFull = totalCount >= meetup.max_participants;
  const isAlmostFull =
    !isFull && totalCount / meetup.max_participants >= 0.88;
  const handleClick = useCallback(() => onClick(meetup), [onClick, meetup]);

  return (
    <AdvancedMarker
      position={{ lat: meetup.location_lat, lng: meetup.location_lng }}
      onClick={handleClick}
      zIndex={isSelected ? 10 : 1}
      title={meetup.title}
    >
      <div className="relative cursor-pointer select-none">
        
        {(isFull || isAlmostFull) && (
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ background: isFull ? "#ef4444" : "#f97316" }}
          >
            {isFull ? t("full") : t("almostFull")}
          </div>
        )}

        
        <svg
          width={isSelected ? 48 : 38}
          height={isSelected ? 62 : 50}
          viewBox="-19 -50 38 50"
          style={{
            filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.26))",
            transition: "width .15s ease, height .15s ease",
            display: "block",
          }}
        >
          <path
            d="M 0 0 C -11 -11 -19 -19 -19 -30 A 19 19 0 1 1 19 -30 C 19 -19 11 -11 0 0 Z"
            fill={meta.pinColor}
          />
          <circle cx="0" cy="-32" r="10" fill="rgba(255,255,255,0.9)" />
        </svg>
      </div>
    </AdvancedMarker>
  );
});

export const ClusterPin = memo(function ClusterPin({ meetups }: { meetups: Meetup[] }) {
  const t = useTranslations("Go.map");
  const map = useMap(MAP_ID);

  const lat = meetups.reduce((s, m) => s + m.location_lat, 0) / meetups.length;
  const lng = meetups.reduce((s, m) => s + m.location_lng, 0) / meetups.length;

  const handleClick = () => {
    if (!map) return;
    map.panTo({ lat, lng });
    map.setZoom(Math.min((map.getZoom() ?? 14) + 3, 20));
  };

  return (
    <AdvancedMarker
      position={{ lat, lng }}
      onClick={handleClick}
      zIndex={20}
      title={t("clusterCount", { count: meetups.length })}
    >
      <div className="flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-full bg-slate-900 text-[13px] font-bold text-white shadow-[0_3px_8px_rgba(0,0,0,0.3)] ring-2 ring-white">
        {meetups.length}
      </div>
    </AdvancedMarker>
  );
});
