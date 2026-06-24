"use client";

import { useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { INDUSTRIES } from "@/constants/industries";

interface IndustrySelectModalProps {
  isOpen: boolean;
  selectedValues: string[];
  onClose: () => void;
  onToggle: (value: string) => void;
}

export function IndustrySelectModal({ isOpen, selectedValues, onClose, onToggle }: IndustrySelectModalProps) {
  const [majorIdx, setMajorIdx] = useState<number | null>(null);
  const [middleIdx, setMiddleIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const major = majorIdx !== null ? INDUSTRIES[majorIdx] : null;
  const middle = major && middleIdx !== null ? major.children[middleIdx] : null;

  const handleMajorClick = (i: number) => {
    setMajorIdx(i);
    setMiddleIdx(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 border border-white/10 rounded-2xl w-full max-w-2xl mx-4 flex flex-col overflow-hidden"
        style={{ maxHeight: "70vh" }}
        onClick={(e) => e.stopPropagation()}
      >

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase">업종 선택</p>
          {selectedValues.length > 0 && (
            <span className="text-[10px] text-white/40 tabular-nums">{selectedValues.length}개 선택됨</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/30 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Three-column panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* 대분류 — 가장 좁음 */}
        <div className="w-[25%] flex flex-col border-r border-white/5 overflow-hidden">
          <p className="px-5 py-3 text-[9px] tracking-[0.3em] text-white/20 uppercase border-b border-white/5 shrink-0">
            대분류
          </p>
          <div className="flex-1 overflow-y-auto">
            {INDUSTRIES.map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleMajorClick(i)}
                className={`w-full text-left flex items-center justify-between gap-2 px-5 py-4 text-sm border-b border-white/5 transition-colors cursor-pointer ${
                  majorIdx === i
                    ? "text-white bg-white/5"
                    : "text-white/40 hover:text-white/70 hover:bg-white/2"
                }`}
              >
                <span>{item.label}</span>
                {majorIdx === i && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/40" />}
              </button>
            ))}
          </div>
        </div>

        {/* 중분류 — 중간 */}
        <div className="w-[35%] flex flex-col border-r border-white/5 overflow-hidden">
          <p className="px-5 py-3 text-[9px] tracking-[0.3em] text-white/20 uppercase border-b border-white/5 shrink-0">
            중분류
          </p>
          <div className="flex-1 overflow-y-auto">
            {major ? major.children.map((item, i) => {
              const isLeaf = item.children.length === 0;
              const isSelected = isLeaf && selectedValues.includes(item.label);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => isLeaf ? onToggle(item.label) : setMiddleIdx(i)}
                  className={`w-full text-left flex items-center justify-between gap-2 px-5 py-4 text-sm border-b border-white/5 transition-colors cursor-pointer ${
                    isSelected || middleIdx === i
                      ? "text-white bg-white/5"
                      : "text-white/40 hover:text-white/70 hover:bg-white/2"
                  }`}
                >
                  <span>{item.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white/50" />}
                  {!isLeaf && middleIdx === i && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/40" />}
                </button>
              );
            }) : (
              <p className="px-5 py-8 text-xs text-white/15">대분류를 먼저 선택하세요</p>
            )}
          </div>
        </div>

        {/* 소분류 — 가장 넓음 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <p className="px-5 py-3 text-[9px] tracking-[0.3em] text-white/20 uppercase border-b border-white/5 shrink-0">
            소분류
          </p>
          <div className="flex-1 overflow-y-auto">
            {middle && middle.children.length > 0 ? middle.children.map((item) => {
              const isSelected = selectedValues.includes(item.label);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onToggle(item.label)}
                  className={`w-full text-left flex items-center justify-between gap-2 px-5 py-4 text-sm border-b border-white/5 transition-colors cursor-pointer ${
                    isSelected
                      ? "text-white bg-white/5"
                      : "text-white/40 hover:text-white/70 hover:bg-white/2"
                  }`}
                >
                  <span>{item.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white/50" />}
                </button>
              );
            }) : (
              <p className="px-5 py-8 text-xs text-white/15">중분류를 선택하세요</p>
            )}
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
