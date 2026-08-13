"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { WORK_DAYS, DAY_PRESETS } from "@/type/job/jobCreate";

interface WorkDaysSectionProps {
  workDays: string[];
  setWorkDays: (v: string[]) => void;
  isTimeNegotiable: boolean;
}

export function WorkDaysSection({
  workDays,
  setWorkDays,
  isTimeNegotiable,
}: WorkDaysSectionProps) {
  const t = useTranslations("Job");
  const te = useTranslations("Enums");

  const toggleDay = (day: string) =>
    setWorkDays(
      workDays.includes(day)
        ? workDays.filter((d) => d !== day)
        : [...workDays, day],
    );

  return (
    <div className="space-y-2">
      <Label>{t("form.workDaysLabel")}</Label>

      <div className="flex flex-wrap gap-2">
        {DAY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={isTimeNegotiable}
            onClick={() => setWorkDays([...preset.days])}
            className="px-3 py-1 rounded-full border border-gray-300 text-sm text-gray-600 transition-colors hover:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {te(`dayPreset.${preset.id}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {WORK_DAYS.map((day) => {
          const selected = workDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              disabled={isTimeNegotiable}
              onClick={() => toggleDay(day)}
              className={`w-9 h-9 rounded-full border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selected
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-teal-500"
              }`}
            >
              {te(`workDay.${day}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
