"use client";

import { Building2, Globe, MapPin, Users, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Company } from "@/type/company";
import Image from "next/image";

interface CompanyInfoCardProps {
  company: Company;
}

export function CompanyInfoCard({ company }: CompanyInfoCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
          {company.company_logo ? (
            <Image
              src={company.company_logo}
              alt={company.company_name}
              className="w-full h-full object-contain"
            />
          ) : (
            <Building2 className="w-8 h-8 text-white/20" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-normal text-white">{company.company_name}</h3>
          {company.industry && (
            <span className="inline-block mt-1 text-xs text-white/50 border border-white/20 px-2 py-0.5 rounded-full">
              {company.industry}
            </span>
          )}
        </div>
      </div>

      <p className="mt-4 text-white/60 leading-relaxed whitespace-pre-line">{company.company_intro}</p>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/40">
        {company.company_year && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>설립 {company.company_year}년</span>
          </div>
        )}
        {company.employee_count && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 shrink-0" />
            <span>직원 {company.employee_count.toLocaleString()}명</span>
          </div>
        )}
        {company.company_address && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{company.company_address}</span>
          </div>
        )}
        {company.company_website && (
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 shrink-0" />
            <a
              href={company.company_website.startsWith("http") ? company.company_website : `https://${company.company_website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white hover:underline"
            >
              {company.company_website}
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
