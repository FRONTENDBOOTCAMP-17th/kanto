"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveSelect } from "@/components/ui/responsive-select";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "30"];

interface WorkHoursSectionProps {
  workHoursStart: string;
  setWorkHoursStart: (v: string) => void;
  workHoursEnd: string;
  setWorkHoursEnd: (v: string) => void;
  isTimeNegotiable: boolean;
  setIsTimeNegotiable: (v: boolean) => void;
  setWorkDays: (v: string[]) => void;
}

export function WorkHoursSection({
  workHoursStart,
  setWorkHoursStart,
  workHoursEnd,
  setWorkHoursEnd,
  isTimeNegotiable,
  setIsTimeNegotiable,
  setWorkDays,
}: WorkHoursSectionProps) {
  const t = useTranslations("Job");

  const HOUR_OPTIONS = HOURS.map((h) => ({
    value: h,
    label: t("form.hourValue", { value: h }),
  }));
  const MINUTE_OPTIONS = MINUTES.map((m) => ({
    value: m,
    label: t("form.minuteValue", { value: m }),
  }));

  const [startHour, startMinute] = (workHoursStart || "00:00").split(":");
  const [endHour, endMinute] = (workHoursEnd || "00:00").split(":");

  const handleTimeNegotiableChange = (checked: boolean) => {
    setIsTimeNegotiable(checked);
    if (checked) {
      setWorkHoursStart("");
      setWorkHoursEnd("");
      setWorkDays([]);
    } else {
      setWorkHoursStart("00:00");
      setWorkHoursEnd("00:00");
    }
  };

  return (
    <div className="space-y-2 border-t pt-4 mt-2">
      <div className="flex items-center justify-between">
        <Label>{t("form.workHoursLabel")}</Label>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <Checkbox
            checked={isTimeNegotiable}
            onCheckedChange={(v) => handleTimeNegotiableChange(v === true)}
          />
          {t("form.timeNegotiable")}
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex items-center gap-2">
          <ResponsiveSelect
            className="flex-1 h-12 rounded-sm sm:w-24 sm:flex-none"
            disabled={isTimeNegotiable}
            value={startHour}
            onValueChange={(h) => setWorkHoursStart(`${h}:${startMinute || "00"}`)}
            options={HOUR_OPTIONS}
            placeholder={t("form.hour")}
          />
          <ResponsiveSelect
            className="flex-1 h-12 rounded-sm sm:w-24 sm:flex-none"
            disabled={isTimeNegotiable}
            value={startMinute}
            onValueChange={(m) => setWorkHoursStart(`${startHour || "00"}:${m}`)}
            options={MINUTE_OPTIONS}
            placeholder={t("form.minute")}
          />
        </div>

        <span className="text-gray-400 text-sm text-center sm:mx-1 sm:text-base sm:text-gray-500">~</span>

        <div className="flex items-center gap-2">
          <ResponsiveSelect
            className="flex-1 h-12 rounded-sm sm:w-24 sm:flex-none"
            disabled={isTimeNegotiable}
            value={endHour}
            onValueChange={(h) => setWorkHoursEnd(`${h}:${endMinute || "00"}`)}
            options={HOUR_OPTIONS}
            placeholder={t("form.hour")}
          />
          <ResponsiveSelect
            className="flex-1 h-12 rounded-sm sm:w-24 sm:flex-none"
            disabled={isTimeNegotiable}
            value={endMinute}
            onValueChange={(m) => setWorkHoursEnd(`${endHour || "00"}:${m}`)}
            options={MINUTE_OPTIONS}
            placeholder={t("form.minute")}
          />
        </div>
      </div>
    </div>
  );
}
