"use client";

// 번개모임 생성 모달 (지도 클릭 → 위치 선택 + 폼 입력)

import { useState } from "react";
import { X, Zap, MapPin, Loader2 } from "lucide-react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { TOPIC_OPTIONS } from "@/constants/meetupTopics";
import { useLocationPicker } from "@/hooks/go/useLocationPicker";
import { createMeetup } from "@/services/go/go";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

const MANILA_CENTER = { lat: 14.5547, lng: 121.0244 };

interface MeetupCreateModalProps {
  onClose: () => void;
  onCreated: (postId: number) => void;
}

export function MeetupCreateModal({ onClose, onCreated }: MeetupCreateModalProps) {
  const { location, geocoding, handleMapClick, reset } = useLocationPicker();

  const [form, setForm] = useState({
    title: "",
    topic: "" as MeetupTopicKey | "",
    date: "",
    startTime: "",
    endTime: "",
    locationDetail: "",
    description: "",
    maxParticipants: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const isValid =
    form.title.trim() &&
    form.topic &&
    form.date &&
    form.startTime &&
    form.endTime &&
    form.description.trim() &&
    location;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const postId = await createMeetup({
        title: form.title.trim(),
        topic: form.topic as MeetupTopicKey,
        description: form.description.trim(),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        lat: location!.lat,
        lng: location!.lng,
        address: location!.address,
        locationDetail: form.locationDetail.trim() || undefined,
        maxParticipants: parseInt(form.maxParticipants) || 6,
      });
      setDone(true);
      setTimeout(() => onCreated(postId), 1800);
    } catch (e: any) {
      alert(e.message ?? "생성 중 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* 백드롭 */}
      <div onClick={onClose} className="fixed inset-0 z-50 bg-slate-900/55" />

      {/* 모달 */}
      <div className="fixed left-1/2 top-1/2 z-[51] flex max-h-[90vh] w-[560px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl">

        {/* 헤더 */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <Zap className="h-5 w-5 text-teal-500" strokeWidth={2.2} />
            <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">번개모임 만들기</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-slate-200 text-slate-500 hover:bg-slate-100">
            <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </div>

        {done ? (
          /* 완료 화면 */
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-teal-50">
              <Zap className="h-8 w-8 text-teal-500" strokeWidth={2} />
            </div>
            <h3 className="mb-2 text-[22px] font-extrabold text-slate-900">모임이 생성됐어요!</h3>
            <p className="text-[15px] leading-relaxed text-slate-500">
              지도에 번개 핀이 꽂혔습니다.<br />주변 사람들이 곧 참여할 거예요.
            </p>
          </div>
        ) : (
          <>
            {/* 폼 */}
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">

              {/* 지도 — 클릭으로 위치 선택 */}
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  장소 선택 <span className="text-red-500">*</span>
                  <span className="ml-1.5 font-normal text-slate-400">(지도를 클릭해 위치를 지정하세요)</span>
                </label>
                <div className="relative h-[140px] overflow-hidden rounded-[14px] border-[1.5px] border-slate-200">
                  <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                    <Map
                      mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
                      defaultCenter={MANILA_CENTER}
                      defaultZoom={13}
                      gestureHandling="greedy"
                      zoomControl={true}
                      disableDefaultUI={false}
                      onClick={handleMapClick}
                      style={{ width: "100%", height: "100%" }}
                    >
                      {location && (
                        <AdvancedMarker position={{ lat: location.lat, lng: location.lng }}>
                          <svg width="28" height="36" viewBox="-14 -36 28 36">
                            <path d="M 0 0 C -8 -8 -14 -14 -14 -22 A 14 14 0 1 1 14 -22 C 14 -14 8 -8 0 0 Z" fill="#14b8a6" />
                            <circle cx="0" cy="-24" r="6" fill="white" />
                          </svg>
                        </AdvancedMarker>
                      )}
                    </Map>
                  </APIProvider>

                  {geocoding && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                    </div>
                  )}
                </div>

                {location ? (
                  <div className="mt-2 flex items-center gap-2 rounded-[10px] bg-teal-50 px-3 py-2.5">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-teal-600" strokeWidth={2} />
                    <span className="text-[13px] font-semibold text-teal-800">{location.address}</span>
                  </div>
                ) : (
                  <p className="mt-1.5 text-[12.5px] text-slate-400">아직 위치가 선택되지 않았습니다</p>
                )}
              </div>

              {/* 제목 */}
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  모임 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={set("title")}
                  placeholder="예: BGC 스시 맛집 탐방"
                  className="w-full rounded-[11px] border-[1.5px] border-slate-200 px-3.5 py-3 text-[14.5px] text-slate-900 outline-none focus:border-teal-400"
                />
              </div>

              {/* 주제 */}
              <div>
                <label className="mb-2.5 block text-[13px] font-bold text-slate-600">
                  주제 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_OPTIONS.map((opt) => {
                    const active = form.topic === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, topic: opt.value }))}
                        className="rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-semibold transition-all"
                        style={{
                          background: active ? opt.color : "#fff",
                          color: active ? "#fff" : opt.color,
                          borderColor: active ? opt.color : opt.border,
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 날짜 / 시간 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <label className="mb-2 block text-[13px] font-bold text-slate-600">
                    날짜 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={set("date")}
                    className="w-full rounded-[11px] border-[1.5px] border-slate-200 px-3.5 py-3 text-[14px] text-slate-900 outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-slate-600">시작</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={set("startTime")}
                    className="w-full rounded-[11px] border-[1.5px] border-slate-200 px-2.5 py-3 text-[14px] text-slate-900 outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-slate-600">종료</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={set("endTime")}
                    className="w-full rounded-[11px] border-[1.5px] border-slate-200 px-2.5 py-3 text-[14px] text-slate-900 outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-slate-600">최대 인원</label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={form.maxParticipants}
                    onChange={set("maxParticipants")}
                    placeholder="6"
                    className="w-full rounded-[11px] border-[1.5px] border-slate-200 px-2.5 py-3 text-[14px] text-slate-900 outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {/* 상세 위치 */}
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">상세 위치 (선택)</label>
                <input
                  value={form.locationDetail}
                  onChange={set("locationDetail")}
                  placeholder="예: 파르코 1층, 2번 출구 앞 등"
                  className="w-full rounded-[11px] border-[1.5px] border-slate-200 px-3.5 py-3 text-[14px] text-slate-900 outline-none focus:border-teal-400"
                />
              </div>

              {/* 한줄 설명 */}
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  한줄 설명 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.description}
                  onChange={set("description")}
                  placeholder="모임을 한 줄로 소개해주세요"
                  className="w-full rounded-[11px] border-[1.5px] border-slate-200 px-3.5 py-3 text-[14.5px] text-slate-900 outline-none focus:border-teal-400"
                />
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="flex flex-shrink-0 gap-2.5 border-t border-slate-100 px-6 py-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-[11px] border border-slate-200 bg-slate-50 py-3.5 text-[14px] font-bold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-[11px] py-3.5 text-[14px] font-bold transition-all disabled:cursor-not-allowed"
                style={{
                  background: isValid ? "#14b8a6" : "#e2e8eb",
                  color: isValid ? "#fff" : "#94a3b8",
                  boxShadow: isValid ? "0 4px 14px rgba(20,184,166,.3)" : "none",
                }}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" strokeWidth={2.2} />
                )}
                번개 핀 꽂기
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
