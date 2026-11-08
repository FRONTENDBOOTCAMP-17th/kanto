"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const RequiredMark = () => <span> *</span>;

interface CompanyBasicSectionProps {
  companyName: string;
  setCompanyName: (v: string) => void;
  companyIntro: string;
  setCompanyIntro: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
}

export function CompanyBasicSection({
  companyName,
  setCompanyName,
  companyIntro,
  setCompanyIntro,
  industry,
  setIndustry,
}: CompanyBasicSectionProps) {
  const t = useTranslations("Job");

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="companyName">{t("form.companyNameLabel")}</Label>
        <Input id="companyName" placeholder={t("form.companyNamePlaceholder")} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12 rounded-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyIntro">{t("form.companyIntroLabel")}</Label>
        <Textarea id="companyIntro" placeholder={t("form.companyIntroPlaceholder")} value={companyIntro} onChange={(e) => setCompanyIntro(e.target.value)} className="resize-none min-h-52 rounded-sm p-5 text-xs md:text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="industry">{t("form.industryLabel")}<RequiredMark /></Label>
        <Input id="industry" placeholder={t("form.industryPlaceholder")} value={industry} onChange={(e) => setIndustry(e.target.value)} className="h-12 rounded-sm" />
      </div>
    </>
  );
}
