"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { JobPreferredModal } from "./JobPreferredModal";
import { TRADE_LOCATIONS, type TradeLocation } from "@/type/location";
import {
  EMPLOYEE_TYPES,
  SALARY_TYPES,
  WORK_DAYS,
  DAY_PRESETS,
  type EmployeeType,
  type SalaryType,
} from "@/type/job/jobCreate";

interface CreateJobFormPageOneProps {
  title: string;
  setTitle: (v: string) => void;
  employeeType: EmployeeType | "";
  setEmployeeType: (v: EmployeeType | "") => void;
  salary: string;
  setSalary: (v: string) => void;
  salaryType: SalaryType | "";
  setSalaryType: (v: SalaryType | "") => void;
  locationType: TradeLocation | "";
  setLocationType: (v: TradeLocation | "") => void;
  locationCustom: string;
  setLocationCustom: (v: string) => void;
  deadline: string;
  setDeadline: (v: string) => void;
  workHoursStart: string;
  setWorkHoursStart: (v: string) => void;
  workHoursEnd: string;
  setWorkHoursEnd: (v: string) => void;
  workDays: string[];
  setWorkDays: (v: string[]) => void;
  isTimeNegotiable: boolean;
  setIsTimeNegotiable: (v: boolean) => void;
  mainTask: string;
  setMainTask: (v: string) => void;
  preferred: string;
  setPreferred: (v: string) => void;
  preferredTags: string[];
  setPreferredTags: (v: string[]) => void;
  handleNextStep: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "30"];

const EMPLOYEE_OPTIONS = EMPLOYEE_TYPES.map((t) => ({
  value: t.id,
  label: t.label,
}));
const SALARY_OPTIONS = SALARY_TYPES.map((t) => ({ value: t, label: t }));
const LOCATION_OPTIONS = TRADE_LOCATIONS.map((l) => ({ value: l, label: l }));

export function CreateJobFormPageOne({
  title,
  setTitle,
  employeeType,
  setEmployeeType,
  salary,
  setSalary,
  salaryType,
  setSalaryType,
  locationType,
  setLocationType,
  locationCustom,
  setLocationCustom,
  deadline,
  setDeadline,
  workHoursStart,
  setWorkHoursStart,
  workHoursEnd,
  setWorkHoursEnd,
  workDays,
  setWorkDays,
  isTimeNegotiable,
  setIsTimeNegotiable,
  mainTask,
  setMainTask,
  preferred,
  setPreferred,
  preferredTags,
  setPreferredTags,
  handleNextStep,
}: CreateJobFormPageOneProps) {
  const [showPreferredModal, setShowPreferredModal] = useState(false);

  const t = useTranslations("Job");
  const te = useTranslations("Enums");
  const tc = useTranslations("Common");

  const HOUR_OPTIONS = HOURS.map((h) => ({
    value: h,
    label: t("form.hourValue", { value: h }),
  }));
  const MINUTE_OPTIONS = MINUTES.map((m) => ({
    value: m,
    label: t("form.minuteValue", { value: m }),
  }));

  const toggleDay = (day: string) =>
    setWorkDays(
      workDays.includes(day)
        ? workDays.filter((d) => d !== day)
        : [...workDays, day],
    );

  const toggleTag = (key: string) =>
    setPreferredTags(
      preferredTags.includes(key)
        ? preferredTags.filter((t) => t !== key)
        : [...preferredTags, key],
    );

  const handleSalaryChange = (value: string) => {
    const rawNumber = value.replace(/\D/g, "");
    setSalary(rawNumber);
  };

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
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleNextStep();
      }}
    >
      <div>
        <h2 className="font-semibold text-xl text-gray-900">
          {t("form.jobInfo")}
        </h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">{t("form.titleLabel")}</Label>
        <Input
          id="title"
          placeholder={t("form.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 rounded-sm"
        />
        {title.length > 0 && title.trim().length < 2 && (
          <p className="text-[13px] text-red-500">{t("form.titleMinLength")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("form.employeeTypeLabel")}</Label>
        <ResponsiveSelect
          value={employeeType}
          onValueChange={(v) => setEmployeeType(v as EmployeeType)}
          options={EMPLOYEE_OPTIONS}
          placeholder={t("form.employeeTypePlaceholder")}
          className="h-12 rounded-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="salary">{t("form.salaryLabel")}</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="salary"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={salary ? Number(salary).toLocaleString() : ""}
              onChange={(e) => handleSalaryChange(e.target.value)}
              className="h-12 rounded-sm pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
              PHP
            </span>
          </div>
          <ResponsiveSelect
            value={salaryType}
            onValueChange={(v) => setSalaryType(v as SalaryType)}
            options={SALARY_OPTIONS}
            placeholder={t("form.salaryUnitPlaceholder")}
            className="w-28 h-12 rounded-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("form.locationLabel")}</Label>
        <ResponsiveSelect
          value={locationType}
          onValueChange={(v) => setLocationType(v as TradeLocation)}
          options={LOCATION_OPTIONS}
          placeholder={t("form.locationPlaceholder")}
          className="h-12 rounded-sm"
        />
        {locationType === "그 외 지역" && (
          <Input
            placeholder={t("form.locationDetailPlaceholder")}
            value={locationCustom}
            onChange={(e) => setLocationCustom(e.target.value)}
            className="h-12 rounded-sm"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">{t("form.deadlineLabel")}</Label>
        <Input
          id="deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="h-12 rounded-sm"
        />
      </div>

      <div className="space-y-4 border-t pt-4 mt-2">
        <div className="space-y-2">
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
                onValueChange={(h) =>
                  setWorkHoursStart(`${h}:${startMinute || "00"}`)
                }
                options={HOUR_OPTIONS}
                placeholder={t("form.hour")}
              />
              <ResponsiveSelect
                className="flex-1 h-12 rounded-sm sm:w-24 sm:flex-none"
                disabled={isTimeNegotiable}
                value={startMinute}
                onValueChange={(m) =>
                  setWorkHoursStart(`${startHour || "00"}:${m}`)
                }
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
                onValueChange={(h) =>
                  setWorkHoursEnd(`${h}:${endMinute || "00"}`)
                }
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="mainTask">{t("form.mainTaskLabel")}</Label>
        <Textarea
          id="mainTask"
          placeholder={t("form.mainTaskPlaceholder")}
          value={mainTask}
          onChange={(e) => setMainTask(e.target.value.slice(0, 5000))}
          className="resize-none min-h-68 rounded-sm p-5 text-xs md:text-sm"
          maxLength={5000}
        />
        {mainTask.length > 0 && mainTask.trim().length < 10 && (
          <p className="text-[13px] text-red-500">{t("form.mainTaskMinLength")}</p>
        )}
        <p className="text-right text-xs text-gray-400">{mainTask.length}/5000</p>
      </div>

      <div className="space-y-2">
        <Label>{t("form.preferredLabel")}</Label>
        <button
          type="button"
          onClick={() => setShowPreferredModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-teal-400 py-2.5 text-sm font-medium text-teal-600 transition-colors hover:border-teal-500 hover:bg-teal-50"
        >
          <Plus className="h-4 w-4" />
          {preferredTags.length > 0
            ? `${preferredTags.length}${t("form.selectedCount")}`
            : t("form.preferredSelect")}
        </button>

        {preferredTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {preferredTags.map((key) => (
              <span
                key={key}
                className="flex items-center gap-1 rounded-full bg-teal-50 py-1 pl-3 pr-2 text-sm text-teal-700"
              >
                {te(`preferredItem.${key}`) ?? key}
                <button
                  type="button"
                  onClick={() => toggleTag(key)}
                  aria-label={tc("delete")}
                  className="transition-colors hover:text-teal-900 flex justify-center"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <Input
          placeholder={t("form.preferredPlaceholder")}
          value={preferred}
          onChange={(e) => setPreferred(e.target.value)}
          className="h-12 rounded-sm"
        />
      </div>

      <JobPreferredModal
        isOpen={showPreferredModal}
        onClose={() => setShowPreferredModal(false)}
        selected={preferredTags}
        onToggle={toggleTag}
      />
    </form>
  );
}
