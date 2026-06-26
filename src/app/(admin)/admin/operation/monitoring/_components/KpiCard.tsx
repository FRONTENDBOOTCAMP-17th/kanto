import { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  icon: ReactNode;
  value: number;
  unit: string;
  valueClassName?: string;
  sub: ReactNode;
}

export function KpiCard({ label, icon, value, unit, valueClassName, sub }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-slate-500">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-[27px] font-extrabold tracking-tight ${valueClassName ?? "text-slate-900"}`}>
          {value.toLocaleString()}
        </span>
        <span className="ml-0.5 text-[14px] font-semibold text-slate-400">{unit}</span>
      </div>
      {sub}
    </div>
  );
}
