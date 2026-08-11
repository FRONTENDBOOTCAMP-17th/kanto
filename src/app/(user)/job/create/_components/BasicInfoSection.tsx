"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { APIProvider } from "@vis.gl/react-google-maps";
import { PlaceAutocomplete } from "@/components/go/PlaceAutocomplete";
import type { PickedLocation } from "@/type/go";
import {
  EMPLOYEE_TYPES,
  SALARY_TYPES,
  type EmployeeType,
  type SalaryType,
} from "@/type/job/jobCreate";

interface BasicInfoSectionProps {
  title: string;
  setTitle: (v: string) => void;
  employeeType: EmployeeType | "";
  setEmployeeType: (v: EmployeeType | "") => void;
  salary: string;
  setSalary: (v: string) => void;
  salaryType: SalaryType | "";
  setSalaryType: (v: SalaryType | "") => void;
  workLocation: PickedLocation | null;
  onWorkLocationSelect: (l: PickedLocation) => void;
  locationFallbackLabel: string | null;
  deadline: string;
  setDeadline: (v: string) => void;
}

export function BasicInfoSection({
  title,
  setTitle,
  employeeType,
  setEmployeeType,
  salary,
  setSalary,
  salaryType,
  setSalaryType,
  workLocation,
  onWorkLocationSelect,
  locationFallbackLabel,
  deadline,
  setDeadline,
}: BasicInfoSectionProps) {
  const t = useTranslations("Job");
  const te = useTranslations("Enums");

  const EMPLOYEE_OPTIONS = EMPLOYEE_TYPES.map((type) => ({
    value: type.id,
    label: te(`employeeType.${type.id}`),
  }));
  const SALARY_OPTIONS = SALARY_TYPES.map((type) => ({
    value: type,
    label: te(`salaryType.${type}`),
  }));

  const handleSalaryChange = (value: string) => {
    const rawNumber = value.replace(/\D/g, "");
    setSalary(rawNumber);
  };

  return (
    <>
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
        <APIProvider
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          libraries={["places"]}
          version="weekly"
        >
          <PlaceAutocomplete
            selected={workLocation}
            onSelect={onWorkLocationSelect}
            fallbackLabel={workLocation ? null : locationFallbackLabel}
          />
        </APIProvider>
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
    </>
  );
}
