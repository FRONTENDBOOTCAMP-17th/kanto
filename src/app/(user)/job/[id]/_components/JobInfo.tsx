import { useTranslations, useLocale } from "next-intl";
import type { JobDetail } from "@/type/job/jobsDetail";
import { BCP47_LOCALE, type Locale } from "@/i18n/config";

export default function JobInfo({ job }: { job: JobDetail }) {
  const t = useTranslations("Job");
  const te = useTranslations("Enums");
  const locale = useLocale() as Locale;

  const location =
    job.location_type === "그 외 지역" && job.location_custom
      ? job.location_custom
      : job.location_type === "그 외 지역"
        ? te("tradeLocation.otherAreas")
        : job.location_type;

  const deadline = new Date(job.deadline).toLocaleDateString(BCP47_LOCALE[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6">
      <h2 className="font-semibold text-base md:text-lg mb-4">{t("jobInfo")}</h2>
      <dl className="space-y-3 text-sm md:text-base">
        <div className="flex gap-2">
          <dt className="w-24 text-gray-500 shrink-0">{t("employeeType")}</dt>
          <dd>- {te(`employeeType.${job.employee_type}`)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 text-gray-500 shrink-0">{t("salary")}</dt>
          <dd className="text-teal-600 font-medium">
            - ₱{job.salary.toLocaleString()}
            {job.salary_type && ` (${te(`salaryType.${job.salary_type}`)})`}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 text-gray-500 shrink-0">{t("workLocation")}</dt>
          <dd>- {location}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 text-gray-500 shrink-0">{t("deadline")}</dt>
          <dd>- {deadline}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 text-gray-500 shrink-0">{t("workHours")}</dt>
          <dd>- {job.is_time_negotiable ? t("form.timeNegotiable") : job.work_hours}</dd>
        </div>
        {!job.is_time_negotiable && job.work_days && job.work_days.length > 0 && (
          <div className="flex gap-2">
            <dt className="w-24 text-gray-500 shrink-0">{t("workDays")}</dt>
            <dd>- {(job.work_days as string[]).map((d) => te(`workDay.${d}`)).join(", ")}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
