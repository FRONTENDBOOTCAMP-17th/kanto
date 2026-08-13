"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";

interface CompanyLogoSectionProps {
  companyLogoUrl: string;
  companyLogoFile: File | null;
  setCompanyLogoFile: (f: File | null) => void;
}

export function CompanyLogoSection({
  companyLogoUrl,
  companyLogoFile,
  setCompanyLogoFile,
}: CompanyLogoSectionProps) {
  const t = useTranslations("Job");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoPreview = companyLogoFile ? URL.createObjectURL(companyLogoFile) : companyLogoUrl || null;

  return (
    <>
      <h2 className="font-semibold text-xl text-gray-900">{t("form.companyInfo")}</h2>
      <div className="space-y-2">
        <Label>{t("form.companyLogoLabel")} <span className="text-gray-400 font-normal text-sm">{t("form.optional")}</span></Label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-teal-400 transition-colors shrink-0"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-3xl text-gray-300">+</span>
            )}
          </button>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{t("form.companyLogoHint")}</p>
            {companyLogoFile && (
              <button type="button" onClick={() => setCompanyLogoFile(null)} className="text-xs text-red-400 hover:underline">
                {t("form.companyLogoRemove")}
              </button>
            )}
          </div>
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setCompanyLogoFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </>
  );
}
