"use client";

import { X } from "lucide-react";

const COMPANY_TYPES = [
  "대기업",
  "30대그룹사",
  "매출1000대기업",
  "중견기업",
  "강소기업",
  "외국계기업",
  "중소기업",
  "벤처기업",
  "자영업자",
  "공공기관/공기업",
  "비영리단체/협회재단",
  "외국기관/단체",
  "상장기업",
  "해외상장기업",
] as const;

interface CompanyTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
}

export function CompanyTypeModal({ isOpen, onClose, onSelect }: CompanyTypeModalProps) {
  if (!isOpen) return null;

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 border border-white/10 rounded-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase">기업형태 선택</p>
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 grid grid-cols-2 gap-1.5 max-h-[60vh] overflow-y-auto">
          {COMPANY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleSelect(type)}
              className="text-left px-4 py-3 border border-white/5 rounded-xl text-sm text-white/40 hover:text-white hover:border-white/20 hover:bg-white/3 transition-colors cursor-pointer"
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
