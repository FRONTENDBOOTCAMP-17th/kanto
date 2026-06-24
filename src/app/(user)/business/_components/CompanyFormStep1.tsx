"use client";

import { Plus } from "lucide-react";

const FIELD_INPUT = "w-full bg-transparent border-b border-white/10 text-white text-sm py-2.5 focus:border-white/40 focus:outline-none placeholder:text-white/20 transition-colors";

interface CompanyFormStep1Props {
  logoPreview: string | null;
  hasLogo: boolean;
  companyName: string;
  companyIntro: string;
  companyType: string;
  onLogoClick: () => void;
  onLogoRemove: () => void;
  onCompanyNameChange: (v: string) => void;
  onCompanyIntroChange: (v: string) => void;
  onCompanyTypeModalOpen: () => void;
}

export function CompanyFormStep1({
  logoPreview,
  hasLogo,
  companyName,
  companyIntro,
  companyType,
  onLogoClick,
  onLogoRemove,
  onCompanyNameChange,
  onCompanyIntroChange,
  onCompanyTypeModalOpen,
}: CompanyFormStep1Props) {
  return (
    <div className="divide-y divide-white/5">

      {/* 로고 */}
      <div className="py-8 flex gap-10 items-start">
        <div className="w-28 shrink-0 pt-1">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">로고</p>
          <p className="text-[9px] text-white/20 mt-1">선택</p>
        </div>
        <div className="flex-1">
          <button
            type="button"
            onClick={onLogoClick}
            className="group w-24 h-24 rounded-2xl border border-white/10 flex flex-col items-center justify-center overflow-hidden hover:border-white/30 transition-colors cursor-pointer"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="logo" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-white/20 group-hover:text-white/40 transition-colors">
                <span className="text-2xl leading-none">+</span>
                <span className="text-[9px] uppercase tracking-widest">Upload</span>
              </div>
            )}
          </button>
          {hasLogo && (
            <button
              type="button"
              onClick={onLogoRemove}
              className="mt-3 text-[10px] text-white/20 hover:text-red-400/60 transition-colors uppercase tracking-wider cursor-pointer"
            >
              제거
            </button>
          )}
        </div>
      </div>

      {/* 회사명 */}
      <div className="py-8 flex gap-10 items-start">
        <div className="w-28 shrink-0 pt-3">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">회사명</p>
          <p className="text-[9px] text-red-400/60 mt-1">필수</p>
        </div>
        <div className="flex-1">
          <input
            placeholder="회사명을 입력해주세요"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            className={FIELD_INPUT}
          />
        </div>
      </div>

      {/* 소개 */}
      <div className="py-8 flex gap-10 items-start">
        <div className="w-28 shrink-0 pt-3">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">소개</p>
          <p className="text-[9px] text-red-400/60 mt-1">필수</p>
        </div>
        <div className="flex-1">
          <textarea
            placeholder="회사를 간략히 소개해주세요"
            value={companyIntro}
            onChange={(e) => onCompanyIntroChange(e.target.value.slice(0, 200))}
            rows={4}
            className={`${FIELD_INPUT} resize-none`}
          />
          <p className={`text-right text-[10px] mt-1 tabular-nums ${companyIntro.length >= 200 ? "text-red-400/70" : "text-white/20"}`}>
            {companyIntro.length}/200
          </p>
        </div>
      </div>

      {/* 기업형태 */}
      <div className="py-8 flex gap-10 items-start">
        <div className="w-28 shrink-0 pt-3">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">기업형태</p>
          <p className="text-[9px] text-red-400/60 mt-1">필수</p>
        </div>
        <div className="flex-1 flex items-center gap-4 pt-1">
          <button
            type="button"
            onClick={onCompanyTypeModalOpen}
            className="w-8 h-8 rounded-xl border border-white/20 flex items-center justify-center text-white/40 hover:border-white/50 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
          {companyType ? (
            <span className="text-sm text-white border-b border-white/20 pb-px">{companyType}</span>
          ) : (
            <span className="text-sm text-white/20">기업형태를 선택해주세요</span>
          )}
        </div>
      </div>

    </div>
  );
}
