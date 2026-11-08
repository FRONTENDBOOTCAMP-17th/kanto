"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { EMPLOYEE_TYPES, type EmployeeType } from "@/type/job/jobCreate";

interface BasicInfoSectionProps {
  title: string;
  setTitle: (v: string) => void;
  employeeType: EmployeeType | "";
  setEmployeeType: (v: EmployeeType | "") => void;
}

export function BasicInfoSection({
  title,
  setTitle,
  employeeType,
  setEmployeeType,
}: BasicInfoSectionProps) {
  const t = useTranslations("Job");
  const te = useTranslations("Enums");

  const EMPLOYEE_OPTIONS = EMPLOYEE_TYPES.map((type) => ({
    value: type.id,
    label: te(`employeeType.${type.id}`),
  }));

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
    </>
  );
}
