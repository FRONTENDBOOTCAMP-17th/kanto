"use client";

// 지도 위 번개모임 핀 컴포넌트 (@vis.gl/react-google-maps AdvancedMarker 사용)

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { TOPIC_META } from "@/constants/meetupTopics";
import type { Meetup } from "@/type/go";

interface MeetupPinProps {
  meetup: Meetup;
  isSelected: boolean;
  onClick: () => void;
}

export function MeetupPin({ meetup, isSelected, onClick }: MeetupPinProps) {
  const meta = TOPIC_META[meetup.topic] ?? TOPIC_META.other;
  const totalCount = meetup.participant_count + 1; // 주최자 포함
  const isFull = totalCount >= meetup.max_participants;
  const isAlmostFull =
    !isFull && totalCount / meetup.max_participants >= 0.88;

  return (
    <AdvancedMarker
      position={{ lat: meetup.location_lat, lng: meetup.location_lng }}
      onClick={onClick}
      zIndex={isSelected ? 10 : 1}
      title={meetup.title}
    >
      <div className="relative cursor-pointer select-none">
        {/* 마감/마감임박 뱃지 */}
        {(isFull || isAlmostFull) && (
          <div
            className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ background: isFull ? "#ef4444" : "#f97316" }}
          >
            {isFull ? "마감" : "마감임박"}
          </div>
        )}

        {/* 핀 SVG */}
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
}
