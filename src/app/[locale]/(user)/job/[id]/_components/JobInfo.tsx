import { useTranslations, useLocale } from "next-intl";
import type { JobDetail } from "@/type/job/jobsDetail";
import { BCP47_LOCALE, type Locale } from "@/i18n/config";

export default function JobInfo({ job }: { job: JobDetail }) {
  const t = useTranslations("Job");
  const te = useTranslations("Enums");
  const locale = useLocale() as Locale;

  const location =
    job.location_custom ??
    (job.location_type === "그 외 지역" ? te("tradeLocation.otherAreas") : job.location_type);

  const deadline = new Date(job.deadline).toLocaleDateString(BCP47_LOCALE[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm flex-1">
      <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("employeeType")}</dt>
      <dd className="text-gray-900">{te(`employeeType.${job.employee_type}`)}</dd>
      <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("salary")}</dt>
      <dd className="text-teal-600 font-medium">
        ₱{job.salary.toLocaleString()}
        {job.salary_type && ` (${te(`salaryType.${job.salary_type}`)})`}
      </dd>
      <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("workLocation")}</dt>
      <dd className="text-gray-900">{location}</dd>
      <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("deadline")}</dt>
      <dd className="text-gray-900">{deadline}</dd>
      <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("workHours")}</dt>
      <dd className="text-gray-900">{job.is_time_negotiable ? t("form.timeNegotiable") : job.work_hours}</dd>
      {!job.is_time_negotiable && job.work_days && job.work_days.length > 0 && (
        <>
          <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("workDays")}</dt>
          <dd className="text-gray-900">{(job.work_days as string[]).map((d) => te(`workDay.${d}`)).join(", ")}</dd>
        </>
      )}
    </dl>
  );
}
