"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { SALARY_TYPES, type SalaryType } from "@/type/job/jobCreate";

interface SalarySectionProps {
  salary: string;
  setSalary: (v: string) => void;
  salaryType: SalaryType | "";
  setSalaryType: (v: SalaryType | "") => void;
}

export function SalarySection({
  salary,
  setSalary,
  salaryType,
  setSalaryType,
}: SalarySectionProps) {
  const t = useTranslations("Job");
  const te = useTranslations("Enums");

  const SALARY_OPTIONS = SALARY_TYPES.map((type) => ({
    value: type,
    label: te(`salaryType.${type}`),
  }));

  const handleSalaryChange = (value: string) => {
    const rawNumber = value.replace(/\D/g, "");
    setSalary(rawNumber);
  };

  return (
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
  );
}
