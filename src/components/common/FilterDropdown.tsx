"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  options: readonly FilterOption[];
  value: string;
  onChange: (value: string) => void;
  align?: "left" | "right";
  label?: string;
}

export function FilterDropdown({
  options,
  value,
  onChange,
  align = "left",
  label = "선택",
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((o) => o.id === value)?.label ?? options[0]?.label;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden flex items-center gap-1 px-3 h-8 rounded-full font-semibold text-gray-800 hover:bg-gray-100 transition-colors whitespace-nowrap text-sm select-none shrink-0"
      >
        {selectedLabel}
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      </button>

      <div className="hidden md:block relative shrink-0" ref={btnRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex items-center gap-1 px-3 h-8 rounded-full font-semibold text-gray-800 hover:bg-gray-100 transition-colors whitespace-nowrap text-sm select-none"
        >
          {selectedLabel}
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            className={`absolute top-full mt-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`dropdown-item ${
                  value === option.id
                    ? "bg-teal-50 text-teal-600 font-semibold"
                    : "text-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl w-full pb-8">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-lg">{label}</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={`${label} 닫기`}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-3">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl mb-2 transition-colors ${
                    value === option.id
                      ? "bg-teal-50 text-teal-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`text-base ${value === option.id ? "font-semibold" : ""}`}
                  >
                    {option.label}
                  </span>
                  {value === option.id && (
                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 12 12"
                      >
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
        </div>
      )}
    </>
  );
}
