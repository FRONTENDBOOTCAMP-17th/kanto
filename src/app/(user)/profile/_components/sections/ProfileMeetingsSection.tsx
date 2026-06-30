"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, MapPin, Clock, CalendarDays } from "lucide-react";

export type MeetupSummary = {
  post_id: number;
  title: string;
  topic: string;
  start_at: string;
  end_at: string;
  location_address: string;
  max_participants: number;
  post_status: string;
  participant_count: number;
  host_name?: string;
};

type SubTab = "created" | "joined";

function getMeetupStatus(start_at: string, end_at: string, post_status: string) {
  const now = new Date();
  if (post_status === "inactive" || new Date(end_at) < now) return "ended";
  if (new Date(start_at) <= now) return "ongoing";
  return "upcoming";
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "예정",
  ongoing: "진행중",
  ended: "종료",
};
const STATUS_COLOR: Record<string, string> = {
  upcoming: "bg-blue-50 text-blue-600",
  ongoing: "bg-teal-50 text-teal-600",
  ended: "bg-gray-100 text-gray-400",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function MeetupCard({ meetup, showHost }: { meetup: MeetupSummary; showHost?: boolean }) {
  const statusKey = getMeetupStatus(meetup.start_at, meetup.end_at, meetup.post_status);
  const isEnded = statusKey === "ended";
  const Wrapper = isEnded ? "div" : Link;
  const wrapperProps = isEnded
    ? { className: "flex flex-col gap-2 rounded-xl border border-gray-100 p-4 opacity-50" }
    : { href: `/go/${meetup.post_id}`, className: "flex flex-col gap-2 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors" };
  return (
    <Wrapper {...(wrapperProps as never)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">{meetup.title}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLOR[statusKey]}`}>
          {STATUS_LABEL[statusKey]}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          {formatDate(meetup.start_at)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1">{meetup.location_address}</span>
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 shrink-0" />
          {meetup.participant_count}/{meetup.max_participants}명
        </span>
        {showHost && meetup.host_name && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            개설자: {meetup.host_name}
          </span>
        )}
      </div>
    </Wrapper>
  );
}

export function ProfileMeetingsSection({
  createdMeetups,
  joinedMeetups,
}: {
  createdMeetups: MeetupSummary[];
  joinedMeetups: MeetupSummary[];
}) {
  const [subTab, setSubTab] = useState<SubTab>("created");
  const list = subTab === "created" ? createdMeetups : joinedMeetups;

  return (
    <div className="px-5 md:px-0 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-4 h-4 text-teal-500" />
          <h2 className="text-lg font-semibold text-gray-900">모임</h2>
        </div>

        <div className="mb-4 flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1 w-fit">
          <button
            onClick={() => setSubTab("created")}
            className={`rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors cursor-pointer ${
              subTab === "created" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            개설한 모임
            {createdMeetups.length > 0 && (
              <span className="ml-1.5 text-[11px] font-medium">{createdMeetups.length}</span>
            )}
          </button>
          <button
            onClick={() => setSubTab("joined")}
            className={`rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors cursor-pointer ${
              subTab === "joined" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            참여한 모임
            {joinedMeetups.length > 0 && (
              <span className="ml-1.5 text-[11px] font-medium">{joinedMeetups.length}</span>
            )}
          </button>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <Users className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">
              {subTab === "created" ? "개설한 모임이 없습니다." : "참여한 모임이 없습니다."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((meetup) => (
              <li key={meetup.post_id}>
                <MeetupCard meetup={meetup} showHost={subTab === "joined"} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
