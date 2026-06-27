"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateJobForm } from "@/hooks/useCreateJobForm";
import { CreateJobFormPageOne } from "./CreateJobFormPage1";
import { CreateJobFormPageTwo } from "./CreateJobFormPage2";
import type { JobInitialData } from "@/type/job/jobCreate";

export function CreateJobForm({ userId, userName, initialData }: { userId: number; userName: string; initialData?: JobInitialData }) {
  const t = useTranslations("Job");
  const form = useCreateJobForm(userId, userName, initialData);

  return (
    <main className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={form.handleBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("form.back")}
        </Button>
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="page-title">{t("form.createTitle")}</h1>
            <span className="text-sm font-medium bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {form.step}/2
            </span>
          </div>
          <p className="text-gray-600 mb-8">{t("form.requiredNotice")}</p>

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
              handleBack={form.handleBack}
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
              setCompanyAddress={form.setCompanyAddress}
              companyWebsite={form.companyWebsite}
              setCompanyWebsite={form.setCompanyWebsite}
              managerName={form.managerName}
              managerTitle={form.managerTitle}
              setManagerTitle={form.setManagerTitle}
              managerPhone={form.managerPhone}
              setManagerPhone={form.setManagerPhone}
              managerEmail={form.managerEmail}
              setManagerEmail={form.setManagerEmail}
              isSubmitting={form.isSubmitting}
              urlError={form.urlError}
              imageUpload={form.imageUpload}
              handleSubmit={form.handleSubmit}
              handlePrevStep={form.handlePrevStep}
            />
          )}
        </Card>
      </div>
    </main>
  );
}
