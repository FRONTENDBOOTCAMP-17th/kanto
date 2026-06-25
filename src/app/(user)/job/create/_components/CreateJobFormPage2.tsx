"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import { useImageUpload } from "@/hooks/useImageUpload";
import Toast from "@/components/common/Toast";

const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/i;

interface CreateJobFormPageTwoProps {
  companyLogoUrl: string;
  companyLogoFile: File | null; setCompanyLogoFile: (f: File | null) => void;
  companyName: string; setCompanyName: (v: string) => void;
  companyIntro: string; setCompanyIntro: (v: string) => void;
  industry: string; setIndustry: (v: string) => void;
  companyYear: string; setCompanyYear: (v: string) => void;
  employeeCount: string; setEmployeeCount: (v: string) => void;
  companyAddress: string; setCompanyAddress: (v: string) => void;
  companyWebsite: string; setCompanyWebsite: (v: string) => void;
  managerName: string;
  managerTitle: string; setManagerTitle: (v: string) => void;
  managerPhone: string; setManagerPhone: (v: string) => void;
  managerEmail: string; setManagerEmail: (v: string) => void;
  isSubmitting: boolean;
  imageUpload: ReturnType<typeof useImageUpload>;
  handleSubmit: () => void;
  handlePrevStep: () => void;
}

export function CreateJobFormPageTwo({
  companyLogoUrl,
  companyLogoFile, setCompanyLogoFile,
  companyName, setCompanyName,
  companyIntro, setCompanyIntro,
  industry, setIndustry,
  companyYear, setCompanyYear,
  employeeCount, setEmployeeCount,
  companyAddress, setCompanyAddress,
  companyWebsite, setCompanyWebsite,
  managerName,
  managerTitle, setManagerTitle,
  managerPhone, setManagerPhone,
  managerEmail, setManagerEmail,
  isSubmitting,
  imageUpload,
  handleSubmit,
  handlePrevStep,
}: CreateJobFormPageTwoProps) {
  const t = useTranslations("Job");
  const tc = useTranslations("Common");
  const [websiteError, setWebsiteError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoPreview = companyLogoFile ? URL.createObjectURL(companyLogoFile) : companyLogoUrl || null;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImageSelectWithToast = (e: React.ChangeEvent<HTMLInputElement>) =>
    imageUpload.handleImageSelect(e, (reason) => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToastMessage(
        reason === "unavailable" ? tc("imageUpload.unavailable") : tc("imageUpload.blocked"),
      );
      setShowToast(true);
      toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
    });

  const handleWebsiteBlur = () => {
    if (companyWebsite && !URL_REGEX.test(companyWebsite)) {
      setWebsiteError(t("form.websiteError"));
    } else {
      setWebsiteError("");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-500">{t("form.page2Subtitle")}</p>

      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">{t("form.companyInfo")}</h2>
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
        <div className="space-y-2">
          <Label htmlFor="companyName">{t("form.companyNameLabel")}</Label>
          <Input id="companyName" placeholder={t("form.companyNamePlaceholder")} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyIntro">{t("form.companyIntroLabel")}</Label>
          <Textarea id="companyIntro" placeholder={t("form.companyIntroPlaceholder")} value={companyIntro} onChange={(e) => setCompanyIntro(e.target.value)} className="resize-none min-h-28" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">{t("form.industryLabel")}</Label>
          <Input id="industry" placeholder={t("form.industryPlaceholder")} value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyYear">{t("form.foundedYearLabel")}</Label>
            <Input id="companyYear" inputMode="numeric" placeholder={t("form.foundedYearPlaceholder")} value={companyYear} onChange={(e) => setCompanyYear(e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeCount">{t("form.employeeCountLabel")}</Label>
            <Input id="employeeCount" inputMode="numeric" placeholder={t("form.employeeCountPlaceholder")} value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value.replace(/\D/g, ""))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyAddress">{t("form.addressLabel")}</Label>
          <Input id="companyAddress" placeholder={t("form.addressPlaceholder")} value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyWebsite">{t("form.websiteLabel")}</Label>
          <Input
            id="companyWebsite"
            placeholder={t("form.websitePlaceholder")}
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            onBlur={handleWebsiteBlur}
          />
          {websiteError && <p className="text-xs text-red-500">{websiteError}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">{t("form.managerInfo")}</h2>
        <div className="space-y-2">
          <Label htmlFor="managerName">{t("form.managerNameLabel")}</Label>
          <Input
            id="managerName"
            value={managerName}
            readOnly
            className="bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="managerTitle">{t("form.managerTitleLabel")}</Label>
          <Input id="managerTitle" placeholder={t("form.managerTitlePlaceholder")} value={managerTitle} onChange={(e) => setManagerTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="managerPhone">{t("form.managerPhoneLabel")}</Label>
          <Input id="managerPhone" placeholder={t("form.managerPhonePlaceholder")} value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="managerEmail">{t("form.managerEmailLabel")}</Label>
          <Input id="managerEmail" type="email" placeholder={t("form.managerEmailPlaceholder")} value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} />
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-4">
          {t("form.photos")} <span className="text-gray-400 font-normal text-sm">{t("form.optional")}</span>
        </h2>
        <ImageUploadField
          fileInputRef={imageUpload.fileInputRef}
          imagePreviews={imageUpload.imagePreviews}
          isChecking={imageUpload.isChecking}
          onUploadClick={imageUpload.handleImageUpload}
          onSelect={handleImageSelectWithToast}
          onRemove={imageUpload.removeImage}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1" disabled={isSubmitting}>{t("form.prev")}</Button>
        <Button type="button" variant="teal" onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? t("form.submitting") : t("form.submit")}
        </Button>
      </div>
      <Toast message={toastMessage} showMessage={showToast} type="error" icon="alert" />
    </div>
  );
}
