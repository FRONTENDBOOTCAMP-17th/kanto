"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RequiredMark = () => <span> *</span>;

interface ManagerInfoSectionProps {
  managerName: string;
  managerTitle: string;
  setManagerTitle: (v: string) => void;
  managerPhone: string;
  setManagerPhone: (v: string) => void;
  managerEmail: string;
  setManagerEmail: (v: string) => void;
}

export function ManagerInfoSection({
  managerName,
  managerTitle,
  setManagerTitle,
  managerPhone,
  setManagerPhone,
  managerEmail,
  setManagerEmail,
}: ManagerInfoSectionProps) {
  const t = useTranslations("Job");

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-xl text-gray-900">{t("form.managerInfo")}</h2>
      <div className="space-y-2">
        <Label htmlFor="managerName">{t("form.managerNameLabel")}</Label>
        <Input
          id="managerName"
          value={managerName}
          readOnly
          className="h-12 rounded-sm bg-gray-100 text-gray-500 cursor-not-allowed"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="managerTitle">{t("form.managerTitleLabel")}<RequiredMark /></Label>
        <Input id="managerTitle" placeholder={t("form.managerTitlePlaceholder")} value={managerTitle} onChange={(e) => setManagerTitle(e.target.value)} className="h-12 rounded-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="managerPhone">{t("form.managerPhoneLabel")}<RequiredMark /></Label>
        <Input id="managerPhone" placeholder={t("form.managerPhonePlaceholder")} value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} className="h-12 rounded-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="managerEmail">{t("form.managerEmailLabel")}<RequiredMark /></Label>
        <Input id="managerEmail" type="email" placeholder={t("form.managerEmailPlaceholder")} value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} className="h-12 rounded-sm" />
      </div>
    </div>
  );
}
