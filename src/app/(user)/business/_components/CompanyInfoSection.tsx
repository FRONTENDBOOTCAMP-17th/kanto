"use client";

import { Building2, Globe, MapPin, Users, Calendar } from "lucide-react";
import type { Company } from "@/type/company";
import Image from "next/image";

interface CompanyInfoSectionProps {
  company: Company;
  onEdit: () => void;
}

export function CompanyInfoSection({ company, onEdit }: CompanyInfoSectionProps) {
  const meta = [
    company.company_year && { label: "설립", value: `${company.company_year}년`, Icon: Calendar },
    company.employee_count && { label: "직원", value: `${company.employee_count.toLocaleString()}명`, Icon: Users },
    company.company_address && { label: "주소", value: company.company_address, Icon: MapPin },
  ].filter(Boolean) as { label: string; value: string; Icon: React.ElementType }[];

  return (
    <section className="border-b border-white/5 px-6 py-14">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-6 min-w-0">
            <div className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {company.company_logo ? (
                <Image src={company.company_logo} alt={company.company_name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-6 h-6 text-white/20" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-2">Company</p>
              <h2 className="text-3xl font-normal text-white leading-tight">{company.company_name}</h2>
              {company.industry && (
                <span className="inline-block mt-2 text-[10px] tracking-wider text-white/30 border border-white/10 px-2.5 py-1 rounded-full uppercase">
                  {company.industry}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 text-[10px] tracking-[0.3em] text-white/20 hover:text-white/60 transition-colors uppercase mt-1"
          >
            편집
          </button>
        </div>

        {company.company_intro && (
          <p className="mt-10 text-white/50 text-sm leading-loose max-w-2xl">
            {company.company_intro}
          </p>
        )}

        {(meta.length > 0 || company.company_website) && (
          <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-x-12 gap-y-4">
            {meta.map(({ label, value, Icon }) => (
              <div key={label}>
                <p className="text-[9px] text-white/20 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-center gap-1.5 text-sm text-white/50">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{value}</span>
                </div>
              </div>
            ))}
            {company.company_website && (
              <div>
                <p className="text-[9px] text-white/20 uppercase tracking-widest mb-1">웹사이트</p>
                <div className="flex items-center gap-1.5 text-sm">
                  <Globe className="w-3.5 h-3.5 shrink-0 text-white/50" />
                  <a
                    href={company.company_website.startsWith("http") ? company.company_website : `https://${company.company_website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/50 hover:text-white transition-colors hover:underline"
                  >
                    {company.company_website}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
