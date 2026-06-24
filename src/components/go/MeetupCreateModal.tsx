"use client";

// 번개모임 생성 모달 (장소 자동완성 + 폼 입력)

import { useState } from "react";
import { X, Zap, Loader2 } from "lucide-react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { TOPIC_OPTIONS } from "@/constants/meetupTopics";
import { PlaceAutocomplete } from "@/components/go/PlaceAutocomplete";
import { createMeetup } from "@/services/go/go";
import type { MeetupTopicKey } from "@/constants/meetupTopics";
import type { PickedLocation } from "@/type/go";

// 드롭다운 옵션
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")); // "00".."23"
const MINUTES = ["00", "10", "20", "30", "40", "50"];
const PARTICIPANTS = Array.from({ length: 29 }, (_, i) => i + 2); // 2..30
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12

// 번개모임은 근시일(올해 안) 한정 — 년도 입력 없이 항상 올해로 생성.
// 과거 날짜/시간 선택을 막기 위한 기준값. 10분 단위 드롭다운에 맞춰 다음 10분 단위로 올림.
const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_DAY = now.getDate();
const roundedMinute = Math.ceil(now.getMinutes() / 10) * 10;
const CURRENT_HOUR = roundedMinute === 60 ? now.getHours() + 1 : now.getHours();
const CURRENT_MINUTE = roundedMinute === 60 ? 0 : roundedMinute;

const toMinutes = (h: string, m: string) => Number(h) * 60 + Number(m);

interface MeetupCreateModalProps {
  onClose: () => void;
  onCreated: (postId: number) => void;
}

export function MeetupCreateModal({ onClose, onCreated }: MeetupCreateModalProps) {
  const [location, setLocation] = useState<PickedLocation | null>(null);

  const [form, setForm] = useState({
    title: "",
    topic: "" as MeetupTopicKey | "",
    month: "",
    day: "",
    startHour: "",
    startMinute: "",
    endHour: "",
    endMinute: "",
    locationDetail: "",
    description: "",
    maxParticipants: "6",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // 선택한 월/일이 "오늘" 기준 이미 지난 시작시간을 가리키면 시작/종료를 초기화
  const clearPastStart = (next: typeof form) => {
    const isToday = Number(next.month) === CURRENT_MONTH && Number(next.day) === CURRENT_DAY;
    if (isToday && next.startHour !== "" && next.startMinute !== "") {
      const startTotal = toMinutes(next.startHour, next.startMinute);
      const nowTotal = CURRENT_HOUR * 60 + CURRENT_MINUTE;
      if (startTotal < nowTotal) {
        next.startHour = "";
        next.startMinute = "";
        next.endHour = "";
        next.endMinute = "";
      }
    }
  };

  // 월 변경 → 선택일이 말일을 넘으면 일 초기화, 오늘 이전 시작시간이면 시간도 초기화
  const setMonth = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((f) => {
      const next = { ...f, month: e.target.value };
      const dim = next.month ? new Date(CURRENT_YEAR, Number(next.month), 0).getDate() : 31;
      if (next.day && Number(next.day) > dim) next.day = "";
      clearPastStart(next);
      return next;
    });

  // 일 변경 → 오늘로 바뀌면서 이미 지난 시작시간이면 초기화
  const setDay = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((f) => {
      const next = { ...f, day: e.target.value };
      clearPastStart(next);
      return next;
    });

  // 시작 변경 → 종료가 시작 이하이면 종료 초기화
  const setStart =
    (k: "startHour" | "startMinute") => (e: React.ChangeEvent<HTMLSelectElement>) =>
      setForm((f) => {
        const next = { ...f, [k]: e.target.value };
        if (
          next.startHour !== "" && next.startMinute !== "" &&
          next.endHour !== "" && next.endMinute !== "" &&
          toMinutes(next.endHour, next.endMinute) <= toMinutes(next.startHour, next.startMinute)
        ) {
          next.endHour = "";
          next.endMinute = "";
        }
        return next;
      });

  // 선택한 월의 말일 (윤년·월별 일수 반영, 항상 올해 기준)
  const daysInMonth = form.month ? new Date(CURRENT_YEAR, Number(form.month), 0).getDate() : 31;
  const isSelectedMonthCurrent = Number(form.month) === CURRENT_MONTH;
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (d) => !isSelectedMonthCurrent || d >= CURRENT_DAY,
  );
  // 월은 올해 남은 달만 선택 가능(년도 입력 없이 항상 올해로 생성)
  const MONTH_OPTIONS = MONTHS.filter((m) => m >= CURRENT_MONTH);

  const isSelectedDateToday =
    isSelectedMonthCurrent && Number(form.day) === CURRENT_DAY;

  // 종료는 시작 이후만 — 드롭다운 옵션을 시작 이후로 제한
  const startSet = form.startHour !== "" && form.startMinute !== "";
  const startHourOptions = isSelectedDateToday
    ? HOURS.filter((h) => Number(h) >= CURRENT_HOUR)
    : HOURS;
  const startMinuteOptions =
    isSelectedDateToday && form.startHour === String(CURRENT_HOUR).padStart(2, "0")
      ? MINUTES.filter((m) => Number(m) >= CURRENT_MINUTE)
      : MINUTES;
  const endHourOptions = startSet ? HOURS.filter((h) => Number(h) >= Number(form.startHour)) : HOURS;
  const endMinuteOptions =
    startSet && form.endHour === form.startHour
      ? MINUTES.filter((m) => Number(m) > Number(form.startMinute))
      : MINUTES;

  const isValid =
    form.title.trim() &&
    form.topic &&
    form.month &&
    form.day &&
    form.startHour &&
    form.startMinute &&
    form.endHour &&
    form.endMinute &&
    form.description.trim() &&
    location;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    const date = `${CURRENT_YEAR}-${form.month.padStart(2, "0")}-${form.day.padStart(2, "0")}`;
    const startTime = `${form.startHour}:${form.startMinute}`;
    if (new Date(`${date}T${startTime}:00`) <= new Date()) {
      alert("이미 지난 시간으로는 모임을 만들 수 없습니다");
      return;
    }
    setSubmitting(true);
    try {
      const postId = await createMeetup({
        title: form.title.trim(),
        topic: form.topic as MeetupTopicKey,
        description: form.description.trim(),
        date,
        startTime,
        endTime: `${form.endHour}:${form.endMinute}`,
        lat: location!.lat,
        lng: location!.lng,
        address: location!.address,
        locationDetail: form.locationDetail.trim() || undefined,
        maxParticipants: parseInt(form.maxParticipants) || 6,
      });
      setDone(true);
      setTimeout(() => onCreated(postId), 1800);
    } catch (e) {
      alert(e instanceof Error ? e.message : "생성 중 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    "w-full rounded-[11px] border-[1.5px] border-slate-200 bg-white px-2.5 py-3 text-[14px] text-slate-900 outline-none focus:border-teal-400";

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

              {/* 장소 — 주소/장소명 자동완성 */}
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  장소 선택 <span className="text-red-500">*</span>
                  <span className="ml-1.5 font-normal text-slate-400">(장소명이나 주소를 검색하세요)</span>
                </label>
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                  <PlaceAutocomplete selected={location} onSelect={setLocation} />
                </APIProvider>
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

              {/* 날짜 (월 / 일 드롭다운, 항상 올해) */}
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  날짜 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select value={form.month} onChange={setMonth} className={selectClass}>
                    <option value="" disabled>월</option>
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                  <select value={form.day} onChange={setDay} className={selectClass}>
                    <option value="" disabled>일</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}일</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 시작 / 종료 시간 (시 + 분 드롭다운, 24시간제) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-slate-600">
                    시작 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select value={form.startHour} onChange={setStart("startHour")} className={selectClass}>
                      <option value="" disabled>시</option>
                      {startHourOptions.map((h) => (
                        <option key={h} value={h}>{parseInt(h)}시</option>
                      ))}
                    </select>
                    <select value={form.startMinute} onChange={setStart("startMinute")} className={selectClass}>
                      <option value="" disabled>분</option>
                      {startMinuteOptions.map((m) => (
                        <option key={m} value={m}>{m}분</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-slate-600">
                    종료 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select value={form.endHour} onChange={set("endHour")} disabled={!startSet} className={`${selectClass} disabled:bg-slate-50 disabled:text-slate-400`}>
                      <option value="" disabled>시</option>
                      {endHourOptions.map((h) => (
                        <option key={h} value={h}>{parseInt(h)}시</option>
                      ))}
                    </select>
                    <select value={form.endMinute} onChange={set("endMinute")} disabled={!startSet} className={`${selectClass} disabled:bg-slate-50 disabled:text-slate-400`}>
                      <option value="" disabled>분</option>
                      {endMinuteOptions.map((m) => (
                        <option key={m} value={m}>{m}분</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 최대 인원 (드롭다운) */}
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">최대 인원</label>
                <select value={form.maxParticipants} onChange={set("maxParticipants")} className={selectClass}>
                  {PARTICIPANTS.map((n) => (
                    <option key={n} value={n}>{n}명</option>
                  ))}
                </select>
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
