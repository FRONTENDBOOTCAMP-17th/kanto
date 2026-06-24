"use client";

import { ImagePlus, Plus, X } from "lucide-react";
import Image from "next/image";

const FIELD_INPUT = "w-full bg-transparent border-b border-white/10 text-white text-sm py-2.5 focus:border-white/40 focus:outline-none placeholder:text-white/20 transition-colors";

interface CompanyFormStep2Props {
  photoPreviews: string[];
  onPhotoUploadClick: () => void;
  onPhotoRemove: (i: number) => void;
  industries: string[];
  onIndustryModalOpen: () => void;
  onIndustryRemove: (v: string) => void;
  companyYear: string;
  employeeCount: string;
  onCompanyYearChange: (v: string) => void;
  onEmployeeCountChange: (v: string) => void;
}

export function CompanyFormStep2({
  photoPreviews,
  onPhotoUploadClick,
  onPhotoRemove,
  industries,
  onIndustryModalOpen,
  onIndustryRemove,
  companyYear,
  employeeCount,
  onCompanyYearChange,
  onEmployeeCountChange,
}: CompanyFormStep2Props) {
  return (
    <div className="divide-y divide-white/5">

      {/* 사진 */}
      <div className="py-8 flex gap-10 items-start">
        <div className="w-28 shrink-0 pt-1">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">사진</p>
          <p className="text-[9px] text-white/20 mt-1">선택</p>
        </div>
        <div className="flex-1">
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  <Image src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => onPhotoRemove(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-950 border border-white/20 text-white/50 rounded-full flex items-center justify-center hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photoPreviews.length < 10 && (
            <button
              type="button"
              onClick={onPhotoUploadClick}
              className="w-full border border-dashed border-white/10 rounded-xl py-8 hover:border-white/25 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center gap-2 text-white/20">
                <ImagePlus className="w-6 h-6" />
                <span className="text-[10px] uppercase tracking-widest">
                  사진 추가 ({photoPreviews.length}/10)
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 산업 */}
      <div className="py-8 flex gap-10 items-start">
        <div className="w-28 shrink-0 pt-3">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">산업</p>
          <p className="text-[9px] text-red-400/60 mt-1">필수</p>
        </div>
        <div className="flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onIndustryModalOpen}
              className="w-8 h-8 rounded-xl border border-white/20 flex items-center justify-center text-white/40 hover:border-white/50 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
            {industries.length > 0 ? industries.map((item) => (
              <span key={item} className="inline-flex items-center gap-1 border border-white/15 rounded-md px-2.5 py-1">
                <span className="text-xs text-white/70 leading-none">{item}</span>
                <button
                  type="button"
                  onClick={() => onIndustryRemove(item)}
                  className="flex items-center text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )) : (
              <span className="text-sm text-white/20">산업을 선택해주세요</span>
            )}
          </div>
        </div>
      </div>

      {/* 규모 */}
      <div className="py-8 flex gap-10 items-start">
        <div className="w-28 shrink-0 pt-3">
          <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">규모</p>
          <p className="text-[9px] text-white/20 mt-1">선택</p>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-8">
          <div>
            <p className="text-[9px] text-white/20 uppercase tracking-widest mb-2">설립 연도</p>
            <input
              inputMode="numeric"
              placeholder="예: 2018"
              value={companyYear}
              onChange={(e) => onCompanyYearChange(e.target.value.replace(/\D/g, ""))}
              className={FIELD_INPUT}
            />
          </div>
          <div>
            <p className="text-[9px] text-white/20 uppercase tracking-widest mb-2">직원 수</p>
            <input
              inputMode="numeric"
              placeholder="예: 50"
              value={employeeCount}
              onChange={(e) => onEmployeeCountChange(e.target.value.replace(/\D/g, ""))}
              className={FIELD_INPUT}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
