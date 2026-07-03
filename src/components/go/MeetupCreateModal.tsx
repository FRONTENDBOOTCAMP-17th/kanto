"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Zap, Loader2 } from "lucide-react";
import { TOPIC_OPTIONS } from "@/constants/meetupTopics";
import { PlaceAutocomplete } from "@/components/go/PlaceAutocomplete";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { createMeetup } from "@/services/go/go";
import { manilaWallTimeToISO } from "@/utils/goTime";
import type { MeetupTopicKey } from "@/constants/meetupTopics";
import type { PickedLocation } from "@/type/go";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")); 
const MINUTES = ["00", "10", "20", "30", "40", "50"];
const PARTICIPANTS = Array.from({ length: 29 }, (_, i) => i + 2); 
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1); 

const toMinutes = (h: string, m: string) => Number(h) * 60 + Number(m);

interface MeetupCreateModalProps {
  onClose: () => void;
  onCreated: (postId: number) => void;
  isClosing?: boolean;
}

export function MeetupCreateModal({
  onClose,
  onCreated,
  isClosing = false,
}: MeetupCreateModalProps) {
  const t = useTranslations("Go");
  
  const now = new Date();
  const CURRENT_YEAR = now.getFullYear();
  const CURRENT_MONTH = now.getMonth() + 1;
  const CURRENT_DAY = now.getDate();
  const roundedMinute = Math.ceil(now.getMinutes() / 10) * 10;
  const CURRENT_HOUR =
    roundedMinute === 60 ? now.getHours() + 1 : now.getHours();
  const CURRENT_MINUTE = roundedMinute === 60 ? 0 : roundedMinute;
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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const setField = (k: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [k]: value }));

  
  const clearPastStart = (next: typeof form) => {
    const isToday =
      Number(next.month) === CURRENT_MONTH && Number(next.day) === CURRENT_DAY;
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

  
  const setMonth = (value: string) =>
    setForm((f) => {
      const next = { ...f, month: value };
      const dim = next.month
        ? new Date(CURRENT_YEAR, Number(next.month), 0).getDate()
        : 31;
      if (next.day && Number(next.day) > dim) next.day = "";
      clearPastStart(next);
      return next;
    });

  
  const setDay = (value: string) =>
    setForm((f) => {
      const next = { ...f, day: value };
      clearPastStart(next);
      return next;
    });

  
  const setStart =
    (k: "startHour" | "startMinute") =>
    (value: string) =>
      setForm((f) => {
        const next = { ...f, [k]: value };
        if (
          next.startHour !== "" &&
          next.startMinute !== "" &&
          next.endHour !== "" &&
          next.endMinute !== "" &&
          toMinutes(next.endHour, next.endMinute) <=
            toMinutes(next.startHour, next.startMinute)
        ) {
          next.endHour = "";
          next.endMinute = "";
        }
        return next;
      });

  
  const daysInMonth = form.month
    ? new Date(CURRENT_YEAR, Number(form.month), 0).getDate()
    : 31;
  const isSelectedMonthCurrent = Number(form.month) === CURRENT_MONTH;
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (d) => !isSelectedMonthCurrent || d >= CURRENT_DAY,
  );
  
  const MONTH_OPTIONS = MONTHS.filter((m) => m >= CURRENT_MONTH);

  const isSelectedDateToday =
    isSelectedMonthCurrent && Number(form.day) === CURRENT_DAY;

  
  const startSet = form.startHour !== "" && form.startMinute !== "";
  const startHourOptions = isSelectedDateToday
    ? HOURS.filter((h) => Number(h) >= CURRENT_HOUR)
    : HOURS;
  const startMinuteOptions =
    isSelectedDateToday &&
    form.startHour === String(CURRENT_HOUR).padStart(2, "0")
      ? MINUTES.filter((m) => Number(m) >= CURRENT_MINUTE)
      : MINUTES;
  const endHourOptions = startSet
    ? HOURS.filter((h) => Number(h) >= Number(form.startHour))
    : HOURS;
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
    
    if (new Date(manilaWallTimeToISO(date, startTime)) <= new Date()) {
      alert(t("create.pastTimeError"));
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
      setTimeout(() => onCreated(postId), 700);
    } catch {
      alert(t("create.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-slate-900/55 ${
          isClosing
            ? "animate-[fadeOut_.3s_ease_forwards]"
            : "animate-[fadeIn_.3s_ease]"
        }`}
      />

      
      <div
        className={`fixed left-1/2 top-1/2 z-51 flex max-h-[90vh] w-140 max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:top-auto max-md:translate-x-0 max-md:translate-y-0 max-md:w-full max-md:max-w-full max-md:rounded-t-2xl max-md:rounded-b-none ${
          isClosing
            ? "md:animate-[modalPopOut_.3s_cubic-bezier(.4,0,.2,1)_forwards] max-md:animate-[slideOutDown_.3s_cubic-bezier(.4,0,.2,1)_forwards]"
            : "md:animate-[modalPopIn_.3s_cubic-bezier(.4,0,.2,1)] max-md:animate-[slideInUp_.3s_cubic-bezier(.4,0,.2,1)]"
        }`}
      >
        
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <Zap className="h-5 w-5 text-teal-500" strokeWidth={2.2} />
            <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
              {t("create.title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        {done ? (
          
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-teal-50">
              <Zap className="h-8 w-8 text-teal-500" strokeWidth={2} />
            </div>
            <h3 className="mb-2 text-[22px] font-extrabold text-slate-900">
              {t("create.doneTitle")}
            </h3>
            <p className="text-[15px] leading-relaxed text-slate-500">
              {t.rich("create.doneDesc", { br: () => <br /> })}
            </p>
          </div>
        ) : (
          <>
            
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
              
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  {t("create.locationLabel")}{" "}
                  <span className="text-red-500">*</span>
                  <span className="ml-1.5 font-normal text-slate-400">
                    {t("create.locationHint")}
                  </span>
                </label>
                <PlaceAutocomplete
                  selected={location}
                  onSelect={setLocation}
                />
              </div>

              
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  {t("create.titleLabel")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={set("title")}
                  placeholder={t("create.titlePlaceholder")}
                  className="w-full rounded-[11px] border-[1.5px] border-slate-200 px-3.5 py-3 text-[14.5px] text-slate-900 outline-none focus:border-teal-400"
                />
              </div>

              
              <div>
                <label className="mb-2.5 block text-[13px] font-bold text-slate-600">
                  {t("create.topicLabel")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_OPTIONS.map((opt) => {
                    const active = form.topic === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, topic: opt.value }))
                        }
                        className="rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-semibold transition-all"
                        style={{
                          background: active ? opt.color : "#fff",
                          color: active ? "#fff" : opt.color,
                          borderColor: active ? opt.color : opt.border,
                        }}
                      >
                        {t(`topics.${opt.value}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  {t("create.dateLabel")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <ResponsiveSelect
                    value={form.month}
                    onValueChange={setMonth}
                    placeholder={t("create.month")}
                    label={t("create.dateLabel")}
                    options={MONTH_OPTIONS.map((m) => ({
                      value: String(m),
                      label: t("create.monthValue", { month: m }),
                    }))}
                  />
                  <ResponsiveSelect
                    value={form.day}
                    onValueChange={setDay}
                    placeholder={t("create.day")}
                    label={t("create.dateLabel")}
                    options={DAYS.map((d) => ({
                      value: String(d),
                      label: t("create.dayValue", { day: d }),
                    }))}
                  />
                </div>
              </div>

              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-slate-600">
                    {t("create.startLabel")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <ResponsiveSelect
                      value={form.startHour}
                      onValueChange={setStart("startHour")}
                      placeholder={t("create.hour")}
                      label={t("create.startLabel")}
                      options={startHourOptions.map((h) => ({
                        value: h,
                        label: t("create.hourValue", { hour: parseInt(h) }),
                      }))}
                    />
                    <ResponsiveSelect
                      value={form.startMinute}
                      onValueChange={setStart("startMinute")}
                      placeholder={t("create.minute")}
                      label={t("create.startLabel")}
                      options={startMinuteOptions.map((m) => ({
                        value: m,
                        label: t("create.minuteValue", { minute: m }),
                      }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-bold text-slate-600">
                    {t("create.endLabel")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <ResponsiveSelect
                      value={form.endHour}
                      onValueChange={setField("endHour")}
                      placeholder={t("create.hour")}
                      label={t("create.endLabel")}
                      disabled={!startSet}
                      options={endHourOptions.map((h) => ({
                        value: h,
                        label: t("create.hourValue", { hour: parseInt(h) }),
                      }))}
                    />
                    <ResponsiveSelect
                      value={form.endMinute}
                      onValueChange={setField("endMinute")}
                      placeholder={t("create.minute")}
                      label={t("create.endLabel")}
                      disabled={!startSet}
                      options={endMinuteOptions.map((m) => ({
                        value: m,
                        label: t("create.minuteValue", { minute: m }),
                      }))}
                    />
                  </div>
                </div>
              </div>

              
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  {t("create.maxParticipants")}
                </label>
                <ResponsiveSelect
                  value={form.maxParticipants}
                  onValueChange={setField("maxParticipants")}
                  label={t("create.maxParticipants")}
                  options={PARTICIPANTS.map((n) => ({
                    value: String(n),
                    label: t("create.participantsValue", { count: n }),
                  }))}
                />
              </div>

              
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  {t("create.locationDetailLabel")}
                </label>
                <input
                  value={form.locationDetail}
                  onChange={set("locationDetail")}
                  placeholder={t("create.locationDetailPlaceholder")}
                  className="w-full rounded-[11px] border-[1.5px] border-slate-200 px-3.5 py-3 text-[14px] text-slate-900 outline-none focus:border-teal-400"
                />
              </div>

              
              <div>
                <label className="mb-2 block text-[13px] font-bold text-slate-600">
                  {t("create.descriptionLabel")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.description}
                  onChange={set("description")}
                  placeholder={t("create.descriptionPlaceholder")}
                  className="w-full rounded-[11px] border-[1.5px] border-slate-200 px-3.5 py-3 text-[14.5px] text-slate-900 outline-none focus:border-teal-400"
                />
              </div>
            </div>

            
            <div className="flex shrink-0 gap-2.5 border-t border-slate-100 px-6 py-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-[11px] border border-slate-200 bg-slate-50 py-3.5 text-[14px] font-bold text-slate-600 hover:bg-slate-100"
              >
                {t("create.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-[11px] py-3.5 text-[14px] font-bold transition-all disabled:cursor-not-allowed"
                style={{
                  background: isValid ? "#14b8a6" : "#e2e8eb",
                  color: isValid ? "#fff" : "#94a3b8",
                  boxShadow: isValid
                    ? "0 4px 14px rgba(20,184,166,.3)"
                    : "none",
                }}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" strokeWidth={2.2} />
                )}
                {t("create.submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
