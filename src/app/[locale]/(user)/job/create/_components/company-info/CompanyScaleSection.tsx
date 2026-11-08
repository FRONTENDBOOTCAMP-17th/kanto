"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompanyScaleSectionProps {
  companyYear: string;
  setCompanyYear: (v: string) => void;
  employeeCount: string;
  setEmployeeCount: (v: string) => void;
}

export function CompanyScaleSection({
  companyYear,
  setCompanyYear,
  employeeCount,
  setEmployeeCount,
}: CompanyScaleSectionProps) {
  const t = useTranslations("Job");

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="companyYear">{t("form.foundedYearLabel")}</Label>
        <Input id="companyYear" inputMode="numeric" placeholder={t("form.foundedYearPlaceholder")} value={companyYear} onChange={(e) => setCompanyYear(e.target.value.replace(/\D/g, ""))} className="h-12 rounded-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="employeeCount">{t("form.employeeCountLabel")}</Label>
        <Input id="employeeCount" inputMode="numeric" placeholder={t("form.employeeCountPlaceholder")} value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value.replace(/\D/g, ""))} className="h-12 rounded-sm" />
      </div>
    </div>
  );
}
