"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useCreateJobForm } from "@/hooks/useCreateJobForm";
import { CreateJobFormPageOne } from "./CreateJobFormPage1";
import { CreateJobFormPageTwo } from "./CreateJobFormPage2";
import type { JobInitialData } from "@/type/job/jobCreate";

export function CreateJobForm({ userId, userName, initialData }: { userId: number; userName: string; initialData?: JobInitialData }) {
  const t = useTranslations("Job");
  const tc = useTranslations("Common");
  const form = useCreateJobForm(userId, userName, initialData);

  return (
    <main className="flex-1 bg-gray-50 py-8 px-4 pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={form.handleBack} className="hover:text-teal-500">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-lg font-semibold">{t("form.createTitle")}</span>
          <span className="text-sm font-medium bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
            {form.step}/2
          </span>
        </div>

        <div className="p-8">
          {form.step === 1 && (
            <CreateJobFormPageOne
              title={form.title}
              setTitle={form.setTitle}
              employeeType={form.employeeType}
              setEmployeeType={form.setEmployeeType}
              salary={form.salary}
              setSalary={form.setSalary}
              salaryType={form.salaryType}
              setSalaryType={form.setSalaryType}
              locationType={form.locationType}
              setLocationType={form.setLocationType}
              locationCustom={form.locationCustom}
              setLocationCustom={form.setLocationCustom}
              deadline={form.deadline}
              setDeadline={form.setDeadline}
              workHoursStart={form.workHoursStart}
              setWorkHoursStart={form.setWorkHoursStart}
              workHoursEnd={form.workHoursEnd}
              setWorkHoursEnd={form.setWorkHoursEnd}
              workDays={form.workDays}
              setWorkDays={form.setWorkDays}
              isTimeNegotiable={form.isTimeNegotiable}
              setIsTimeNegotiable={form.setIsTimeNegotiable}
              mainTask={form.mainTask}
              setMainTask={form.setMainTask}
              preferred={form.preferred}
              setPreferred={form.setPreferred}
              preferredTags={form.preferredTags}
              setPreferredTags={form.setPreferredTags}
              handleNextStep={form.handleNextStep}
            />
          )}

          {form.step === 2 && (
            <CreateJobFormPageTwo
              companyLogoUrl={form.companyLogoUrl}
              companyLogoFile={form.companyLogoFile}
              setCompanyLogoFile={form.setCompanyLogoFile}
              companyName={form.companyName}
              setCompanyName={form.setCompanyName}
              companyIntro={form.companyIntro}
              setCompanyIntro={form.setCompanyIntro}
              industry={form.industry}
              setIndustry={form.setIndustry}
              companyYear={form.companyYear}
              setCompanyYear={form.setCompanyYear}
              employeeCount={form.employeeCount}
              setEmployeeCount={form.setEmployeeCount}
              companyAddress={form.companyAddress}
              companyLocation={form.companyLocation}
              setCompanyLocation={form.setCompanyLocation}
              companyWebsite={form.companyWebsite}
              setCompanyWebsite={form.setCompanyWebsite}
              managerName={form.managerName}
              managerTitle={form.managerTitle}
              setManagerTitle={form.setManagerTitle}
              managerPhone={form.managerPhone}
              setManagerPhone={form.setManagerPhone}
              managerEmail={form.managerEmail}
              setManagerEmail={form.setManagerEmail}
              imageUpload={form.imageUpload}
              handleSubmit={form.handleSubmit}
            />
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 bg-gray-50 pb-4 -mx-4 px-4 md:static md:bg-transparent md:pb-0 md:max-w-7xl md:mx-auto md:px-8">
        <hr className="border-gray-200" />
        <p className="text-center text-xs md:text-sm text-gray-500 mt-4">{t("form.sellerDisclaimer")}</p>
        {form.urlError && (
          <p className="text-[13px] text-red-500 mt-2">{form.urlError}</p>
        )}
        <div className="flex gap-3 pt-4">
          {form.step === 1 ? (
            <>
              <Button type="button" variant="outline" onClick={form.handleBack} className="flex-1 h-12" disabled={form.isSubmitting}>
                {tc("cancel")}
              </Button>
              <Button type="button" variant="teal" onClick={form.handleNextStep} className="flex-1 h-12" disabled={!form.isStep1Valid}>
                {t("form.next")}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={form.handlePrevStep} className="flex-1 h-12" disabled={form.isSubmitting}>
                {t("form.prev")}
              </Button>
              <Button type="button" variant="teal" onClick={form.handleSubmit} className="flex-1 h-12" disabled={form.isSubmitting || !form.isStep2Valid}>
                {form.isSubmitting ? t("form.submitting") : t("form.submit")}
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
