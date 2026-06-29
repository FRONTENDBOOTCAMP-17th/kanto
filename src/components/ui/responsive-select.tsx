"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;

  className?: string;

  label?: string;
}

export function ResponsiveSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  required,
  className,
  label,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className={`relative ${className ?? "w-full"}`}>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setMobileOpen(true)}
        className="flex h-full w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
      >
        <span className={`truncate ${selectedLabel ? "" : "text-muted-foreground"}`}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>


      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="hidden h-full w-full md:flex">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 모바일/데스크톱 모두에서 브라우저 기본 필수 검증이 동작하도록 하는 숨김 select */}
      {required && (
        <select
          aria-hidden
          tabIndex={-1}
          required
          disabled={disabled}
          value={value}
          onChange={() => {}}
          className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
        >
          <option value="" />
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}


      {mobileOpen &&
        createPortal(
          <div className="fixed inset-0 z-100 flex flex-col justify-end md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative flex max-h-[70vh] w-full flex-col rounded-t-3xl bg-white pb-8">
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-gray-300" />
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <span className="text-lg font-bold text-gray-900">
                  {label ?? placeholder ?? "선택"}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="닫기"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="overflow-y-auto px-4 py-3">
                {options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onValueChange(o.value);
                      setMobileOpen(false);
                    }}
                    className={`mb-2 flex w-full items-center justify-between rounded-xl px-5 py-4 transition-colors ${
                      value === o.value
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`text-base ${value === o.value ? "font-semibold" : ""}`}>
                      {o.label}
                    </span>
                    {value === o.value && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
