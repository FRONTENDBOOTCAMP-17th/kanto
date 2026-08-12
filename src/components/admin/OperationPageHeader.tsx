"use client";

import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";

export function OperationPageHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <Link
        href="/admin/operation"
        className="mb-2 flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600 active:scale-100"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
        운영 관리
      </Link>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
          <Icon className="h-5 w-5 text-teal-600" strokeWidth={2} />
        </div>
        <h1 className="text-[24px] font-bold text-slate-900">{title}</h1>
      </div>
      <p className="mt-1 text-[13px] text-slate-500">{description}</p>
    </div>
  );
}
