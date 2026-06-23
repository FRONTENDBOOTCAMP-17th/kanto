"use client";

// 핀 클릭 시 우측에서 슬라이드 인하는 모임 상세 패널

import { useEffect, useState } from "react";
import { X, Calendar, MapPin, Users, Zap, Siren, AlertTriangle } from "lucide-react";
import { TOPIC_META } from "@/constants/meetupTopics";
import { joinMeetup, cancelJoin, getMeetupDetail, hostEndMeetup } from "@/services/go/go";
import { checkReported } from "@/services/report";
import ReportModal, { POST_REPORT_CATEGORIES } from "@/components/common/ReportModal";
import type { Meetup, MeetupParticipant } from "@/type/go";

interface MeetupDetailPanelProps {
  meetup: Meetup | null;
  onClose: () => void;
  currentUserId?: number;
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = [
    { bg: "#fee2e2", fg: "#dc2626" },
    { bg: "#dbeafe", fg: "#2563eb" },
    { bg: "#ede9fe", fg: "#7c3aed" },
    { bg: "#ffedd5", fg: "#ea580c" },
    { bg: "#dcfce7", fg: "#16a34a" },
    { bg: "#fce7f3", fg: "#db2777" },
  ];
  let idx = 0;
  for (let i = 0; i < name.length; i++) idx = (idx + name.charCodeAt(i)) % colors.length;
  const { bg, fg } = colors[idx];
  return (
    <div
      style={{ width: size, height: size, background: bg, color: fg }}
      className="flex flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
    >
      {name.charAt(0)}
    </div>
  );
}

export function MeetupDetailPanel({ meetup, onClose, currentUserId }: MeetupDetailPanelProps) {
  const [participants, setParticipants] = useState<MeetupParticipant[]>([]);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [toast, setToast] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reported, setReported] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!meetup) return;
    setJoined(false);
    setReported(false);
    setConfirmEnd(false);
    getMeetupDetail(meetup.post_id)
      .then(({ participants }) => {
        setParticipants(participants);
        if (currentUserId) {
          setJoined(participants.some((p) => p.user_id === currentUserId));
          checkReported(meetup.post_id, currentUserId).then(setReported);
        }
      })
      .catch(console.error);
  }, [meetup, currentUserId]);

  if (!meetup) return null;

  const isHost = currentUserId !== undefined && currentUserId === meetup.host_id;
  const meta = TOPIC_META[meetup.topic] ?? TOPIC_META.other;
  const totalCount = meetup.participant_count + 1;
  const isFull = totalCount >= meetup.max_participants && !joined;
  const capPct = Math.min(100, Math.round((totalCount / meetup.max_participants) * 100));
  const capColor = capPct >= 90 ? "#ef4444" : capPct >= 70 ? "#f97316" : "#14b8a6";

  const startDate = new Date(meetup.start_at);
  const endDate   = new Date(meetup.end_at);
  const dateLabel = startDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  const timeRange = `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")} ~ ${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const handleJoin = async () => {
    if (joining || isFull) return;
    setJoining(true);
    try {
      if (joined) {
        await cancelJoin(meetup.post_id);
        setJoined(false);
        showToast("참여를 취소했습니다");
      } else {
        await joinMeetup(meetup.post_id);
        setJoined(true);
        showToast("모임에 참여했습니다! 주최자에게 알림이 전송됩니다");
      }
    } catch (e: any) {
      showToast(e.message ?? "오류가 발생했습니다");
    } finally {
      setJoining(false);
    }
  };

  const handleEnd = async () => {
    if (ending) return;
    setEnding(true);
    try {
      await hostEndMeetup(meetup.post_id);
      showToast("모임을 종료했습니다");
      setConfirmEnd(false);
      onClose();
    } catch (e: any) {
      showToast(e.message ?? "오류가 발생했습니다");
    } finally {
      setEnding(false);
    }
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20"
        style={{ top: 60 }}
      />

      {/* 패널 */}
      <div
        className="fixed bottom-0 right-0 top-[60px] flex w-[420px] max-w-full animate-[slideInRight_.28s_cubic-bezier(.4,0,.2,1)] flex-col bg-white shadow-[-8px_0_36px_rgba(0,0,0,0.12)]"
        style={{ zIndex: 41 }}
      >
        {/* 헤더 */}
        <div className="flex-shrink-0 border-b border-slate-100 px-6 py-5">
          <div className="mb-2.5 flex items-start justify-between gap-3">
            <h2 className="flex-1 text-[19px] font-extrabold leading-snug tracking-tight text-slate-900">
              {meetup.title}
            </h2>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <button
                onClick={() => setShowReportModal(true)}
                aria-label="신고"
                className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <Siren className="h-4 w-4" strokeWidth={2.2} />
              </button>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-slate-200 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-[12.5px] font-bold"
              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
            >
              {meta.label}
            </span>
            {isFull && (
              <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[12px] font-bold text-red-600">
                정원 마감
              </span>
            )}
          </div>
        </div>

        {/* 내용 */}
        <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-6 py-5">
          {/* 일시 / 장소 */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-slate-50">
                <Calendar className="h-4 w-4 text-slate-400" strokeWidth={2} />
              </div>
              <span className="text-[14px] font-semibold text-slate-700">
                {dateLabel} · {timeRange}
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-slate-50">
                <MapPin className="h-4 w-4 text-slate-400" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-slate-700">{meetup.location_address}</div>
                {meetup.location_detail && (
                  <div className="mt-0.5 text-[13px] text-slate-400">{meetup.location_detail}</div>
                )}
              </div>
            </div>
          </div>

          {/* 주최자 + 정원 현황 */}
          <div className="rounded-[14px] border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div style={{ boxShadow: "0 0 0 2.5px #14b8a6" }} className="rounded-full">
                  <Avatar name={meetup.host_name} size={38} />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-slate-900">{meetup.host_name}</div>
                  <div className="text-[11.5px] text-slate-400">모임 개설자</div>
                </div>
              </div>
              <span className="text-[13px] text-slate-500">
                <span className="font-bold" style={{ color: capColor }}>{totalCount}</span>
                /{meetup.max_participants}명
              </span>
            </div>
            {/* 정원 바 */}
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${capPct}%`, background: capColor }}
              />
            </div>
            {/* 참여자 아바타 */}
            <div className="flex flex-wrap gap-2">
              {participants.slice(0, 7).map((p) => (
                <Avatar key={p.id} name={p.display_name} size={34} />
              ))}
              {participants.length > 7 && (
                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
                  +{participants.length - 7}
                </div>
              )}
            </div>
          </div>

          {/* 소개 */}
          <div>
            <div className="mb-2 text-[11.5px] font-bold uppercase tracking-widest text-slate-400">
              모임 소개
            </div>
            <p className="text-[14px] leading-relaxed text-slate-600">{meetup.description}</p>
          </div>
        </div>

        {/* 참여 버튼 / 호스트 관리 버튼 */}
        <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4">
          {isHost ? (
            meetup.status === "inactive" ? (
              <div className="flex items-center justify-center gap-2 rounded-[11px] bg-slate-50 py-3 text-[13.5px] font-semibold text-slate-500">
                종료된 모임입니다
              </div>
            ) : confirmEnd ? (
              <div className="flex flex-col gap-3 rounded-[13px] border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-700" strokeWidth={2.1} />
                  <div>
                    <div className="text-[14px] font-bold text-slate-900">모임을 종료하시겠습니까?</div>
                    <div className="mt-1 text-[13px] text-slate-500">
                      참여자에게 종료 알림이 발송되고 지도에서 핀이 사라집니다.
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmEnd(false)}
                    className="flex-1 rounded-[10px] border border-slate-200 bg-white py-2.5 text-[13.5px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleEnd}
                    disabled={ending}
                    className="flex-1 rounded-[10px] bg-orange-600 py-2.5 text-[13.5px] font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {ending ? "처리 중..." : "종료 확인"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmEnd(true)}
                className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-slate-50 py-3.5 text-[15px] font-bold text-slate-700 hover:bg-slate-100"
              >
                모임 종료하기
              </button>
            )
          ) : (
            <button
              onClick={handleJoin}
              disabled={isFull || joining}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] py-3.5 text-[15px] font-bold transition-all disabled:cursor-not-allowed"
              style={{
                background: isFull
                  ? "#f1f5f9"
                  : joined
                  ? "#fff"
                  : "#14b8a6",
                color: isFull ? "#94a3b8" : joined ? "#475569" : "#fff",
                border: joined ? "1.5px solid #e2e8eb" : "none",
                boxShadow: !isFull && !joined ? "0 4px 14px rgba(20,184,166,.3)" : "none",
              }}
            >
              {!isFull && <Zap className="h-4 w-4" strokeWidth={2.2} />}
              {joining ? "처리 중..." : isFull ? "정원 마감" : joined ? "참여 취소" : "참여하기"}
            </button>
          )}
        </div>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-xl bg-slate-900 px-5 py-3.5 text-[13.5px] font-semibold text-white shadow-2xl">
          <span className="text-emerald-400">✓</span>
          {toast}
        </div>
      )}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={meetup.post_id}
        userId={currentUserId}
        initialReported={reported}
        categories={POST_REPORT_CATEGORIES}
        targetType="post"
      />
    </>
  );
}
