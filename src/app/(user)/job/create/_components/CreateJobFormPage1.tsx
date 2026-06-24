"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
  handleBack: () => void;
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
  handleBack,
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
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-white/40 text-sm">{t("form.page1Subtitle")}</p>
        <h2 className="font-normal text-xl text-white mt-1">
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
        />
      </div>

      
      <div className="space-y-2">
        <Label>{t("form.employeeTypeLabel")}</Label>
        <ResponsiveSelect
          value={employeeType}
          onValueChange={(v) => setEmployeeType(v as EmployeeType)}
          options={EMPLOYEE_OPTIONS}
          placeholder={t("form.employeeTypePlaceholder")}
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
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">
              PHP
            </span>
          </div>
          <ResponsiveSelect
            value={salaryType}
            onValueChange={(v) => setSalaryType(v as SalaryType)}
            options={SALARY_OPTIONS}
            placeholder={t("form.salaryUnitPlaceholder")}
            className="w-28"
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
        />
        {locationType === "그 외 지역" && (
          <Input
            placeholder={t("form.locationDetailPlaceholder")}
            value={locationCustom}
            onChange={(e) => setLocationCustom(e.target.value)}
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
        />
      </div>

      
      <div className="space-y-4 border-t pt-4 mt-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t("form.workHoursLabel")}</Label>
            <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer select-none">
              <Checkbox
                checked={isTimeNegotiable}
                onCheckedChange={(v) => handleTimeNegotiableChange(v === true)}
              />
              {t("form.timeNegotiable")}
            </label>
          </div>

          <div className="flex items-center gap-2">
            
            <ResponsiveSelect
              className="w-24"
              disabled={isTimeNegotiable}
              value={startHour}
              onValueChange={(h) =>
                setWorkHoursStart(`${h}:${startMinute || "00"}`)
              }
              options={HOUR_OPTIONS}
              placeholder={t("form.hour")}
            />
            
            <ResponsiveSelect
              className="w-24"
              disabled={isTimeNegotiable}
              value={startMinute}
              onValueChange={(m) =>
                setWorkHoursStart(`${startHour || "00"}:${m}`)
              }
              options={MINUTE_OPTIONS}
              placeholder={t("form.minute")}
            />

            <span className="text-white/30 mx-1">~</span>

            
            <ResponsiveSelect
              className="w-24"
              disabled={isTimeNegotiable}
              value={endHour}
              onValueChange={(h) =>
                setWorkHoursEnd(`${h}:${endMinute || "00"}`)
              }
              options={HOUR_OPTIONS}
              placeholder={t("form.hour")}
            />
            
            <ResponsiveSelect
              className="w-24"
              disabled={isTimeNegotiable}
              value={endMinute}
              onValueChange={(m) => setWorkHoursEnd(`${endHour || "00"}:${m}`)}
              options={MINUTE_OPTIONS}
              placeholder={t("form.minute")}
            />
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
                className="px-3 py-1 rounded-full border border-white/20 text-sm text-white/50 transition-colors hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white/60 border-white/20 hover:border-white/40"
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
          onChange={(e) => setMainTask(e.target.value)}
          className="resize-none min-h-28"
        />
      </div>

      
      <div className="space-y-2">
        <Label>{t("form.preferredLabel")}</Label>
        <button
          type="button"
          onClick={() => setShowPreferredModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-white/20 py-2.5 text-sm font-normal text-white/50 transition-colors hover:border-white/40 hover:bg-white/3"
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
                className="flex items-center gap-1 rounded-full bg-white/10 py-1 pl-3 pr-2 text-sm text-white/60"
              >
                {te(`preferredItem.${key}`) ?? key}
                <button
                  type="button"
                  onClick={() => toggleTag(key)}
                  aria-label={tc("delete")}
                  className="transition-colors hover:text-teal-900 flex justify-center "
                >
                  <X className="h-3.5 w-3.5 " />
                </button>
              </span>
            ))}
          </div>
        )}

        <Input
          placeholder={t("form.preferredPlaceholder")}
          value={preferred}
          onChange={(e) => setPreferred(e.target.value)}
        />
      </div>

      
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="flex-1"
        >
          {tc("cancel")}
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={handleNextStep}
          className="flex-1"
        >
          {t("form.next")}
        </Button>
      </div>

      
      <JobPreferredModal
        isOpen={showPreferredModal}
        onClose={() => setShowPreferredModal(false)}
        selected={preferredTags}
        onToggle={toggleTag}
      />
    </div>
  );
}
