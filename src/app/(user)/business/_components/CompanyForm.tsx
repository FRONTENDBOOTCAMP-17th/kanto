"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import { CompanyFormStep1 } from "./CompanyFormStep1";
import { CompanyFormStep2 } from "./CompanyFormStep2";
import { CompanyFormStep3 } from "./CompanyFormStep3";
import { IndustrySelectModal } from "./IndustrySelectModal";
import { CompanyTypeModal } from "./CompanyTypeModal";
import type { Company } from "@/type/company";

const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/i;
const STEPS = ["기본 정보", "회사 상세", "위치 · 연락처"] as const;

interface CompanyFormProps {
  userId: number;
  initialData: Company | null;
  onSuccess: (company: Company) => void;
  onCancel?: () => void;
}

export function CompanyForm({ userId, initialData, onSuccess, onCancel }: CompanyFormProps) {
  const isEdit = !!initialData;
  const [step, setStep] = useState(1);

  // Step 1
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialData?.company_logo ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState(initialData?.company_name ?? "");
  const [companyIntro, setCompanyIntro] = useState(initialData?.company_intro ?? "");
  const [companyType, setCompanyType] = useState(initialData?.company_type ?? "");
  const [showCompanyTypeModal, setShowCompanyTypeModal] = useState(false);

  // Step 2
  const {
    fileInputRef: photoInputRef,
    imagePreviews: photoPreviews,
    handleImageUpload: onPhotoUploadClick,
    handleImageSelect: onPhotoSelect,
    removeImage: onPhotoRemove,
  } = useImageUpload();
  const [industries, setIndustries] = useState<string[]>(
    initialData?.industry ? initialData.industry.split(" / ") : []
  );
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [companyYear, setCompanyYear] = useState(initialData?.company_year?.toString() ?? "");
  const [employeeCount, setEmployeeCount] = useState(initialData?.employee_count?.toString() ?? "");

  // Step 3
  const [companyAddress, setCompanyAddress] = useState(initialData?.company_address ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(initialData?.company_website ?? "");
  const [websiteError, setWebsiteError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : logoUrl || null;
  const step1Valid = companyName.trim().length > 0 && companyIntro.trim().length > 0 && companyType.trim().length > 0;
  const step2Valid = industries.length > 0;

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoUrl || null;
    const ext = logoFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `logos/company/${userId}.${ext}`;
    const { error } = await supabase.storage.from("images").upload(path, logoFile, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleWebsiteChange = (v: string) => {
    setCompanyWebsite(v);
    if (websiteError) setWebsiteError("");
  };

  const handleWebsiteBlur = () => {
    if (companyWebsite && !URL_REGEX.test(companyWebsite)) {
      setWebsiteError("올바른 URL 형식이 아닙니다.");
    } else {
      setWebsiteError("");
    }
  };

  const handleSubmit = async () => {
    if (companyWebsite && !URL_REGEX.test(companyWebsite)) {
      setWebsiteError("올바른 URL 형식이 아닙니다.");
      return;
    }
    setIsSubmitting(true);

    const uploadedLogoUrl = await uploadLogo();
    if (logoFile && !uploadedLogoUrl) {
      alert("로고 업로드에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      company_name: companyName.trim(),
      company_intro: companyIntro.trim(),
      company_logo: uploadedLogoUrl,
      industry: industries.length > 0 ? industries.join(" / ") : null,
      company_year: companyYear ? Number(companyYear) : null,
      employee_count: employeeCount ? Number(employeeCount) : null,
      company_type: companyType.trim() || null,
      company_address: companyAddress.trim() || null,
      company_website: companyWebsite.trim() || null,
    };

    const res = await fetch("/api/business/company", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("저장에 실패했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
      return;
    }

    const saved: Company = await res.json();
    onSuccess(saved);
  };

  return (
    <main className="flex-1 bg-gray-950 py-16 px-6">
      <div className="max-w-2xl mx-auto">

        {/* Hidden file inputs — always mounted so refs are stable */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const file = e.target.files?.[0] ?? null; setLogoFile(file); e.target.value = ""; }}
        />
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onPhotoSelect}
        />

        <h1 className="text-4xl font-normal text-white mb-10">
          {isEdit ? "회사 정보 편집" : "회사 등록"}
        </h1>

        {/* Progress */}
        <div className="flex gap-1.5 mb-3">
          {([1, 2, 3] as const).map((s) => (
            <div
              key={s}
              className={`h-px flex-1 transition-all duration-500 ${step >= s ? "bg-white/50" : "bg-white/10"}`}
            />
          ))}
        </div>
        <p className="text-[10px] tracking-[0.3em] text-white/25 uppercase mb-12">
          {step} / 3 — {STEPS[step - 1]}
        </p>

        {step === 1 && (
          <CompanyFormStep1
            logoPreview={logoPreview}
            hasLogo={!!(logoFile || logoUrl)}
            companyName={companyName}
            companyIntro={companyIntro}
            companyType={companyType}
            onLogoClick={() => logoInputRef.current?.click()}
            onLogoRemove={() => { setLogoFile(null); setLogoUrl(""); }}
            onCompanyNameChange={setCompanyName}
            onCompanyIntroChange={setCompanyIntro}
            onCompanyTypeModalOpen={() => setShowCompanyTypeModal(true)}
          />
        )}

        {step === 2 && (
          <CompanyFormStep2
            photoPreviews={photoPreviews}
            onPhotoUploadClick={onPhotoUploadClick}
            onPhotoRemove={onPhotoRemove}
            industries={industries}
            onIndustryModalOpen={() => setShowIndustryModal(true)}
            onIndustryRemove={(v) => setIndustries((prev) => prev.filter((x) => x !== v))}
            companyYear={companyYear}
            employeeCount={employeeCount}
            onCompanyYearChange={setCompanyYear}
            onEmployeeCountChange={setEmployeeCount}
          />
        )}

        {step === 3 && (
          <CompanyFormStep3
            companyAddress={companyAddress}
            companyWebsite={companyWebsite}
            websiteError={websiteError}
            onCompanyAddressChange={setCompanyAddress}
            onCompanyWebsiteChange={handleWebsiteChange}
            onWebsiteBlur={handleWebsiteBlur}
          />
        )}

        {/* Actions */}
        <div className="pt-16 flex gap-4">
          {step === 1 && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-white/20 text-white/40 text-sm font-normal py-4 rounded-lg hover:border-white/40 hover:text-white/60 transition-colors cursor-pointer"
            >
              취소
            </button>
          )}
          {step >= 2 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 border border-white/20 text-white/40 text-sm font-normal py-4 rounded-lg hover:border-white/40 hover:text-white/60 transition-colors cursor-pointer"
            >
              이전
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
              className="flex-1 bg-white text-black text-sm font-normal py-4 rounded-lg hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !!websiteError}
              className="flex-1 bg-white text-black text-sm font-normal py-4 rounded-lg hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : isEdit ? "수정 완료" : "회사 등록"}
            </button>
          )}
        </div>

      </div>

      <IndustrySelectModal
        isOpen={showIndustryModal}
        selectedValues={industries}
        onClose={() => setShowIndustryModal(false)}
        onToggle={(v) => setIndustries((prev) =>
          prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
        )}
      />
      <CompanyTypeModal
        isOpen={showCompanyTypeModal}
        onClose={() => setShowCompanyTypeModal(false)}
        onSelect={setCompanyType}
      />
    </main>
  );
}
