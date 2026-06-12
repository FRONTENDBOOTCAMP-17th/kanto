"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  options: readonly FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterDropdown({
  options,
  value,
  onChange,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
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

  return (
    <div className="relative shrink-0" ref={btnRef}>
      <button
        type="button"
        onClick={() => {
          const rect = btnRef.current?.getBoundingClientRect();
          if (rect) setPos({ top: rect.bottom + 8, left: rect.left });
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1 px-3 h-8 rounded-full font-semibold text-gray-800 hover:bg-gray-100 transition-colors whitespace-nowrap text-sm select-none"
      >
        {selectedLabel}
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="fixed w-40 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-100"
          style={{ top: pos.top, left: pos.left }}
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
  );
}
