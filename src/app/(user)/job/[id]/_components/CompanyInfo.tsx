import { useTranslations } from "next-intl";
import type { JobDetail } from "@/type/job/jobsDetail";
import CompanyLocationMap from "./CompanyLocationMap";

const LOGO_COLORS = [
  "bg-teal-500", "bg-blue-500", "bg-violet-500",
  "bg-orange-500", "bg-pink-500", "bg-emerald-500",
];

function CompanyLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="w-14 h-14 rounded-xl object-contain border border-gray-100 bg-white shrink-0"
      />
    );
  }
  const color = LOGO_COLORS[name.charCodeAt(0) % LOGO_COLORS.length];
  return (
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shrink-0 ${color}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CompanyInfo({ job }: { job: JobDetail }) {
  const t = useTranslations("Job");
  return (
    <div className="p-6 space-y-4">
      <h2 className="font-semibold text-base md:text-lg">{t("companyInfo")}</h2>
      <div className="space-y-3">
        <div className="flex gap-3">
          <CompanyLogo name={job.company_name} logoUrl={job.company_logo} />
          <div className="space-y-1">
            <h3 className="font-semibold md:text-lg">{job.company_name}</h3>
            {job.industry && (
              <p className="text-sm md:text-base text-gray-500">{job.industry}</p>
            )}
          </div>
        </div>
        <p className="text-sm md:text-base text-gray-600 whitespace-pre-line">
          {job.company_intro}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {job.company_year && (
          <div>
            <p className="text-xs md:text-sm text-gray-400">{t("foundedYear")}</p>
            <p className="text-sm md:text-base font-medium">{t("yearSuffix", { year: job.company_year })}</p>
          </div>
        )}
        {job.employee_count && (
          <div>
            <p className="text-xs md:text-sm text-gray-400">{t("employeeCount")}</p>
            <p className="text-sm md:text-base font-medium">{t("employeeCountValue", { count: job.employee_count })}</p>
          </div>
        )}
        {job.company_address && (
          <div>
            <p className="text-xs md:text-sm text-gray-400">{t("address")}</p>
            <p className="text-sm md:text-base font-medium">{job.company_address}</p>
          </div>
        )}
        {job.company_website && (
          <div>
            <p className="text-xs md:text-sm text-gray-400">{t("website")}</p>
            <a
              href={job.company_website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm md:text-base font-medium text-teal-600 hover:underline"
            >
              {job.company_website}
            </a>
          </div>
        )}
      </div>
      {job.company_lat != null && job.company_lng != null && (
        <div className="pt-2">
          <CompanyLocationMap
            lat={job.company_lat}
            lng={job.company_lng}
            address={job.company_address}
          />
        </div>
      )}
    </div>
  );
}
