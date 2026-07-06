"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import {
  Calendar,
  MapPin,
  Zap,
  Siren,
  MessageCircle,
  ChevronLeft,
} from "lucide-react";
import {
  joinMeetup,
  cancelJoin,
  getMeetupDetail,
  getMyMeetupStatus,
  hostEndMeetup,
} from "@/services/go/go";
import { checkReported } from "@/services/report";
import { MANILA_TZ, formatManilaTimeRange } from "@/utils/goTime";
import { MeetupAvatar } from "@/components/go/MeetupAvatar";
import { TopicBadge } from "@/components/go/TopicBadge";
import { ConfirmInline } from "@/components/go/ConfirmInline";
import { GoToast } from "@/components/go/GoToast";
import ReportModal, {
  POST_REPORT_CATEGORIES,
} from "@/components/common/ReportModal";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { useChatStore } from "@/store/chatStore";
import type { Meetup, MeetupParticipant } from "@/type/go";

interface MeetupDetailPanelProps {
  meetup: Meetup | null;
  onClose: () => void;
  onBackToList?: () => void; 
  currentUserId?: number;
  suppressOverlay?: boolean;
}

type MeetupDetailPanelContentProps = Omit<MeetupDetailPanelProps, "meetup"> & {
  meetup: Meetup;
  isClosing?: boolean;
};

type MyMeetupStatus = "loading" | "joined" | "cancelled" | "none";

export function MeetupDetailPanel({ meetup, ...props }: MeetupDetailPanelProps) {
  const [renderMeetup, setRenderMeetup] = useState<Meetup | null>(meetup);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (meetup) {
      setRenderMeetup(meetup);
      setIsClosing(false);
      return;
    }
    setIsClosing(true);
    const id = setTimeout(() => {
      setRenderMeetup(null);
      setIsClosing(false);
    }, 280);
    return () => clearTimeout(id);
  }, [meetup]);

  if (!renderMeetup) return null;

  return (
    <MeetupDetailPanelContent
      key={renderMeetup.post_id}
      meetup={renderMeetup}
      isClosing={isClosing}
      {...props}
    />
  );
}

function MeetupDetailPanelContent({
  meetup,
  onClose,
  onBackToList,
  currentUserId,
  suppressOverlay,
  isClosing = false,
}: MeetupDetailPanelContentProps) {
  const t = useTranslations("Go");
  const format = useFormatter();
  const [dragOffset, setDragOffset] = useState(0);
  const [snapClosing, setSnapClosing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setSnapClosing(false);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragOffset(delta);
  };
  const handleTouchEnd = () => {
    touchStartY.current = null;
    if (dragOffset > 80) {
      setSnapClosing(true);
      setDragOffset(window.innerHeight);
      onClose();
    } else {
      setDragOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY;
    setSnapClosing(false);
    dragOffsetRef.current = 0;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      if (delta > 0) {
        dragOffsetRef.current = delta;
        setDragOffset(delta);
      }
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (dragOffsetRef.current > 80) {
        setSnapClosing(true);
        setDragOffset(window.innerHeight);
        onClose();
      } else {
        setDragOffset(0);
      }
      dragOffsetRef.current = 0;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const [participants, setParticipants] = useState<MeetupParticipant[]>([]);
  const [joining, setJoining] = useState(false);
  const [myStatusState, setMyStatusState] = useState<{
    postId: number;
    userId: number | null;
    status: MyMeetupStatus;
  }>(() => ({
    postId: meetup.post_id,
    userId: currentUserId ?? null,
    status: currentUserId ? "loading" : "none",
  }));
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(
    null,
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [reported, setReported] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    let active = true;

    getMeetupDetail(meetup.post_id)
      .then(({ participants }) => {
        if (active) setParticipants(participants);
      })
      .catch(() => {});

    if (currentUserId) {
      getMyMeetupStatus(meetup.post_id)
        .then((status) => {
          if (active) {
            setMyStatusState({
              postId: meetup.post_id,
              userId: currentUserId,
              status,
            });
          }
        })
        .catch(() => {
          if (active) {
            setMyStatusState({
              postId: meetup.post_id,
              userId: currentUserId,
              status: "none",
            });
          }
        });
      checkReported(meetup.post_id, currentUserId)
        .then((isReported) => {
          if (active) setReported(isReported);
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [meetup.post_id, currentUserId]);

  const myStatus = myStatusState.status;
  const statusLoading = currentUserId
    ? myStatusState.postId !== meetup.post_id ||
      myStatusState.userId !== currentUserId ||
      myStatusState.status === "loading"
    : false;
  const joined = !statusLoading && myStatus === "joined";
  const isHost =
    currentUserId !== undefined && currentUserId === meetup.host_id;
  const canReport = !isHost;
  const totalCount = meetup.participant_count + 1;
  const isFull = totalCount >= meetup.max_participants && !joined;
  const capPct = Math.min(
    100,
    Math.round((totalCount / meetup.max_participants) * 100),
  );
  const capColor =
    capPct >= 90 ? "#ef4444" : capPct >= 70 ? "#f97316" : "#14b8a6";

  const startDate = new Date(meetup.start_at);
  const dateLabel = format.dateTime(startDate, {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: MANILA_TZ,
  });
  const timeRange = formatManilaTimeRange(meetup.start_at, meetup.end_at);

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 2600);
  };

  const handleJoin = async () => {
    if (!currentUserId) {
      setShowLoginModal(true);
      return;
    }
    if (joining || statusLoading || isFull) return;
    
    if (myStatus === "cancelled") {
      showToast(t("toast.reentryForbidden"), true);
      return;
    }
    setJoining(true);
    try {
      await joinMeetup(meetup.post_id);
      setMyStatusState({
        postId: meetup.post_id,
        userId: currentUserId ?? null,
        status: "joined",
      });
      showToast(t("toast.joined"));
    } catch (e) {
      const reentry = e instanceof Error && e.message === "REENTRY_FORBIDDEN";
      showToast(reentry ? t("toast.reentryForbidden") : t("toast.error"), true);
    } finally {
      setJoining(false);
    }
  };

  const handleCancel = async () => {
    if (joining || statusLoading) return;
    setJoining(true);
    try {
      await cancelJoin(meetup.post_id);
      setMyStatusState({
        postId: meetup.post_id,
        userId: currentUserId ?? null,
        status: "cancelled",
      });
      setConfirmCancel(false);
      showToast(t("toast.cancelled"));
    } catch (e) {
      const afterStart =
        e instanceof Error && e.message === "CANCEL_AFTER_START";
      showToast(afterStart ? t("toast.cancelAfterStart") : t("toast.error"), true);
    } finally {
      setJoining(false);
    }
  };

  const handleEnd = async () => {
    if (ending) return;
    setEnding(true);
    try {
      await hostEndMeetup(meetup.post_id);
      showToast(t("toast.ended"));
      setConfirmEnd(false);
      useChatStore.getState().refreshGroupRoomsList();
      onClose();
    } catch {
      showToast(t("toast.error"), true);
    } finally {
      setEnding(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-x-0 bottom-0 top-12 z-40 bg-black/20 md:top-27.25 ${
          suppressOverlay ? "hidden max-md:block" : ""
        }`}
      />

      
      <div
        className={`fixed bottom-0 right-0 top-15 md:top-27.25 flex w-85 max-w-full flex-col bg-white shadow-[-8px_0_36px_rgba(0,0,0,0.12)] lg:w-97.5 max-md:left-0 max-md:top-auto max-md:h-[85vh] max-md:w-full max-md:rounded-t-2xl ${
          snapClosing
            ? ""
            : isClosing
              ? "animate-[slideOutRight_.28s_cubic-bezier(.4,0,.2,1)_forwards] max-md:animate-[slideOutDown_.28s_cubic-bezier(.4,0,.2,1)_forwards]"
              : "animate-[slideInRight_.28s_cubic-bezier(.4,0,.2,1)] max-md:animate-[slideInUp_.28s_cubic-bezier(.4,0,.2,1)]"
        }`}
        style={{
          zIndex: 41,
          ...(dragOffset > 0 && {
            transform: `translateY(${dragOffset}px)`,
            transition: snapClosing ? "transform 0.28s ease" : "none",
          }),
        }}
      >
        <div
          className="flex justify-center pt-2 pb-1 md:hidden touch-none cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        
        <div className="shrink-0 border-b border-slate-100 px-6 py-5 max-md:pt-3">
          <div className="mb-2.5 flex items-start justify-between gap-3">
            <div className="flex flex-1 min-w-0 items-start gap-2">
              <button
                onClick={onBackToList}
                aria-label={t("detail.back")}
                className={`mt-0.5 shrink-0 text-slate-500 hover:text-slate-700 md:hidden ${
                  onBackToList ? "" : "hidden"
                }`}
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
              </button>
              <h2 className="min-w-0 flex-1 truncate text-[19px] max-md:text-[16px] font-extrabold leading-snug tracking-tight text-slate-900">
                {meetup.title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {canReport && (
                <button
                  onClick={() => setShowReportModal(true)}
                  aria-label={t("detail.reportAria")}
                  className="flex h-8 items-center gap-1.5 rounded-[9px] border border-slate-200 px-2.5 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Siren className="h-4 w-4" strokeWidth={2.2} />
                  <span className="text-[12.5px] font-bold">
                    {t("detail.report")}
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TopicBadge
              topic={meetup.topic}
              label={t(`topics.${meetup.topic}`)}
            />
            {isFull && (
              <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[12px] font-bold text-red-600">
                {t("detail.full")}
              </span>
            )}
          </div>
        </div>

        
        <div className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-6 py-5">
          
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-slate-50">
                <Calendar className="h-4 w-4 text-slate-400" strokeWidth={2} />
              </div>
              <span className="text-[14px] max-md:text-[12.5px] font-semibold text-slate-700">
                {dateLabel} · {timeRange}
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-slate-50">
                <MapPin className="h-4 w-4 text-slate-400" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[14px] max-md:text-[12.5px] font-semibold text-slate-700">
                  {meetup.location_address}
                </div>
                {meetup.location_detail && (
                  <div className="mt-0.5 text-[13px] max-md:text-[12px] text-slate-400">
                    {meetup.location_detail}
                  </div>
                )}
              </div>
            </div>
          </div>

          
          <div className="rounded-[14px] border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ boxShadow: "0 0 0 2.5px #14b8a6" }}
                  className="rounded-full"
                >
                  <MeetupAvatar name={meetup.host_name} size={38} />
                </div>
                <div>
                  <div className="text-[14px] max-md:text-[13px] font-bold text-slate-900">
                    {meetup.host_name}
                  </div>
                  <div className="text-[11.5px] text-slate-400">
                    {t("detail.host")}
                  </div>
                </div>
              </div>
              <span className="text-[13px] max-md:text-[12px] text-slate-500">
                {t.rich("detail.capacity", {
                  current: totalCount,
                  max: meetup.max_participants,
                  b: (chunks) => (
                    <span className="font-bold" style={{ color: capColor }}>
                      {chunks}
                    </span>
                  ),
                })}
              </span>
            </div>
            
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${capPct}%`, background: capColor }}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {participants.slice(0, 7).map((p) => (
                <MeetupAvatar key={p.id} name={p.display_name} size={34} />
              ))}
              {participants.length > 7 && (
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
                  {t("detail.moreParticipants", {
                    count: participants.length - 7,
                  })}
                </div>
              )}
            </div>
          </div>

          
          <div>
            <div className="mb-2 text-[11.5px] font-bold uppercase tracking-widest text-slate-400">
              {t("detail.intro")}
            </div>
            <p className="text-[14px] max-md:text-[13px] leading-relaxed text-slate-600">
              {meetup.description}
            </p>
          </div>
        </div>

        
        <div className="shrink-0 border-t border-slate-100 px-6 py-4 flex flex-col gap-2.5">
          {(isHost || joined) && meetup.status !== "inactive" && (
            <button
              onClick={() => {
                useChatStore
                  .getState()
                  .openGroupRoom({
                    meetupPostId: meetup.post_id,
                    title: meetup.title,
                  });
                onClose(); 
              }}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-teal-200 bg-teal-50 py-3 text-[14px] max-md:text-[13px] font-bold text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
              {t("detail.joinChat")}
            </button>
          )}
          {isHost ? (
            meetup.status === "inactive" ? (
              <div className="flex items-center justify-center gap-2 rounded-[11px] bg-slate-50 py-3 text-[13.5px] max-md:text-[12.5px] font-semibold text-slate-500">
                {t("detail.ended")}
              </div>
            ) : confirmEnd ? (
              <ConfirmInline
                tone="warning"
                title={t("detail.endTitle")}
                description={t("detail.endDesc")}
                cancelLabel={t("detail.cancel")}
                confirmLabel={t("detail.endConfirm")}
                loadingLabel={t("detail.ending")}
                loading={ending}
                onCancel={() => setConfirmEnd(false)}
                onConfirm={handleEnd}
              />
            ) : (
              <button
                onClick={() => setConfirmEnd(true)}
                className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-slate-50 py-3.5 text-[15px] max-md:text-[13px] font-bold text-slate-700 hover:bg-slate-100"
              >
                {t("detail.endMeetup")}
              </button>
            )
          ) : statusLoading ? (
            <button
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center rounded-[12px] bg-slate-100 py-3.5 text-[15px] max-md:text-[13px] font-bold text-slate-400"
            >
              {t("detail.processing")}
            </button>
          ) : confirmCancel ? (
            <ConfirmInline
              tone="danger"
              title={t("detail.cancelTitle")}
              cancelLabel={t("detail.cancelStay")}
              confirmLabel={t("detail.cancelConfirm")}
              loadingLabel={t("detail.processing")}
              loading={joining}
              onCancel={() => setConfirmCancel(false)}
              onConfirm={handleCancel}
            />
          ) : (
            <button
              onClick={joined ? () => setConfirmCancel(true) : handleJoin}
              disabled={isFull || joining}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] py-3.5 text-[15px] max-md:text-[13px] font-bold transition-all disabled:cursor-not-allowed"
              style={{
                background: isFull ? "#f1f5f9" : joined ? "#fff" : "#14b8a6",
                color: isFull ? "#94a3b8" : joined ? "#475569" : "#fff",
                border: joined ? "1.5px solid #e2e8eb" : "none",
                boxShadow:
                  !isFull && !joined
                    ? "0 4px 14px rgba(20,184,166,.3)"
                    : "none",
              }}
            >
              {!isFull && !joined && (
                <Zap className="h-4 w-4" strokeWidth={2.2} />
              )}
              {joining
                ? t("detail.processing")
                : isFull
                  ? t("detail.full")
                  : joined
                    ? t("detail.cancelJoin")
                    : t("detail.join")}
            </button>
          )}
        </div>
      </div>

      
      {toast && <GoToast message={toast.msg} error={toast.error} showIcon />}

      {canReport && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          postId={meetup.post_id}
          userId={currentUserId}
          initialReported={reported}
          categories={POST_REPORT_CATEGORIES}
          targetType="post"
          onToast={(msg, type) => showToast(msg, type === "error")}
        />
      )}

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
