"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRADE_LOCATIONS, type TradeLocation } from "@/type/location";
import { EMPLOYEE_TYPES, SALARY_TYPES, type EmployeeType, type SalaryType } from "@/type/job/jobCreate";

interface CreateJobFormPageOneProps {
  title: string; setTitle: (v: string) => void;
  employeeType: EmployeeType | ""; setEmployeeType: (v: EmployeeType | "") => void;
  salary: string; setSalary: (v: string) => void;
  salaryType: SalaryType | ""; setSalaryType: (v: SalaryType | "") => void;
  locationType: TradeLocation | ""; setLocationType: (v: TradeLocation | "") => void;
  locationCustom: string; setLocationCustom: (v: string) => void;
  deadline: string; setDeadline: (v: string) => void;
  workHoursStart: string; setWorkHoursStart: (v: string) => void;
  workHoursEnd: string; setWorkHoursEnd: (v: string) => void;
  mainTask: string; setMainTask: (v: string) => void;
  preferred: string; setPreferred: (v: string) => void;
  handleNextStep: () => void;
  handleBack: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "30"];

export function CreateJobFormPageOne({
  title, setTitle,
  employeeType, setEmployeeType,
  salary, setSalary,
  salaryType, setSalaryType,
  locationType, setLocationType,
  locationCustom, setLocationCustom,
  deadline, setDeadline,
  workHoursStart, setWorkHoursStart,
  workHoursEnd, setWorkHoursEnd,
  mainTask, setMainTask,
  preferred, setPreferred,
  handleNextStep,
  handleBack,
}: CreateJobFormPageOneProps) {
  const t = useTranslations("Job");
  const te = useTranslations("Enums");
  const tc = useTranslations("Common");
  return (
    <div className="space-y-4">
      <p className="text-gray-500">{t("form.page1Subtitle")}</p>
      <h2 className="font-semibold text-gray-900">{t("form.jobInfo")}</h2>

      <div className="space-y-2">
        <Label htmlFor="title">{t("form.titleLabel")}</Label>
        <Input id="title" placeholder={t("form.titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>{t("form.employeeTypeLabel")}</Label>
        <Select value={employeeType} onValueChange={(v) => setEmployeeType(v as EmployeeType)}>
          <SelectTrigger><SelectValue placeholder={t("form.employeeTypePlaceholder")} /></SelectTrigger>
          <SelectContent>
            {EMPLOYEE_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>{te(`employeeType.${type.id}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("form.salaryLabel")}</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={salary ? Number(salary).toLocaleString() : ""}
              onChange={(e) => setSalary(e.target.value.replace(/,/g, ""))}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">PHP</span>
          </div>
          <Select value={salaryType} onValueChange={(v) => setSalaryType(v as SalaryType)}>
            <SelectTrigger className="w-24"><SelectValue placeholder={t("form.salaryUnitPlaceholder")} /></SelectTrigger>
            <SelectContent>
              {SALARY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{te(`salaryType.${type}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("form.locationLabel")}</Label>
        <Select value={locationType} onValueChange={(v) => setLocationType(v as TradeLocation)}>
          <SelectTrigger><SelectValue placeholder={t("form.locationPlaceholder")} /></SelectTrigger>
          <SelectContent>
            {TRADE_LOCATIONS.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc === "그 외 지역" ? te("tradeLocation.otherAreas") : loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {locationType === "그 외 지역" && (
          <Input placeholder={t("form.locationDetailPlaceholder")} value={locationCustom} onChange={(e) => setLocationCustom(e.target.value)} />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">{t("form.deadlineLabel")}</Label>
        <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>{t("form.workHoursLabel")}</Label>
        <div className="flex items-center gap-2">
          <Select value={workHoursStart.split(":")[0] ?? ""} onValueChange={(h) => setWorkHoursStart(`${h}:${workHoursStart.split(":")[1] ?? "00"}`)}>
            <SelectTrigger className="w-20"><SelectValue placeholder={t("form.hour")} /></SelectTrigger>
            <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{t("form.hourValue", { value: h })}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={workHoursStart.split(":")[1] ?? ""} onValueChange={(m) => setWorkHoursStart(`${workHoursStart.split(":")[0] ?? "00"}:${m}`)}>
            <SelectTrigger className="w-20"><SelectValue placeholder={t("form.minute")} /></SelectTrigger>
            <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={m}>{t("form.minuteValue", { value: m })}</SelectItem>)}</SelectContent>
          </Select>
          <span className="text-gray-500">~</span>
          <Select value={workHoursEnd.split(":")[0] ?? ""} onValueChange={(h) => setWorkHoursEnd(`${h}:${workHoursEnd.split(":")[1] ?? "00"}`)}>
            <SelectTrigger className="w-20"><SelectValue placeholder={t("form.hour")} /></SelectTrigger>
            <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{t("form.hourValue", { value: h })}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={workHoursEnd.split(":")[1] ?? ""} onValueChange={(m) => setWorkHoursEnd(`${workHoursEnd.split(":")[0] ?? "00"}:${m}`)}>
            <SelectTrigger className="w-20"><SelectValue placeholder={t("form.minute")} /></SelectTrigger>
            <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={m}>{t("form.minuteValue", { value: m })}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mainTask">{t("form.mainTaskLabel")}</Label>
        <Textarea id="mainTask" placeholder={t("form.mainTaskPlaceholder")} value={mainTask} onChange={(e) => setMainTask(e.target.value)} rows={4} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred">{t("form.preferredLabel")}</Label>
        <Textarea id="preferred" placeholder={t("form.preferredPlaceholder")} value={preferred} onChange={(e) => setPreferred(e.target.value)} rows={3} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handleBack} className="flex-1">{tc("cancel")}</Button>
        <Button type="button" variant="teal" onClick={handleNextStep} className="flex-1">{t("form.next")}</Button>
      </div>
    </div>
  );
}
