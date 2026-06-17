import { useTranslations } from "next-intl";
import type { JobDetail } from "@/type/job/jobsDetail";

export default function CompanyInfo({ job }: { job: JobDetail }) {
  const t = useTranslations("Job");
  return (
    <div className="p-6 space-y-4">
      <h2 className="font-semibold text-base md:text-lg">{t("companyInfo")}</h2>
      <div className="space-y-1">
        <h3 className="font-semibold md:text-lg">{job.company_name}</h3>
        {job.industry && (
          <p className="text-sm md:text-base text-gray-500">{job.industry}</p>
        )}
        <p className="text-sm md:text-base text-gray-600 whitespace-pre-line pt-1">
          {job.company_intro}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {job.company_year && (
          <div>
            <p className="text-xs md:text-sm text-gray-400">{t("foundedYear")}</p>
            <p className="text-sm md:text-base font-medium>{t("yearSuffix", { year: job.company_year })}</p>
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
    </div>
  );
}
