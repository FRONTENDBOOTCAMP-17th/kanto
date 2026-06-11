"use client";

import { Card } from "@/components/ui/card";
import { useCreateJobForm } from "@/hooks/useCreateJobForm";
import { CreateJobFormPageOne } from "./CreateJobFormPage1";
import { CreateJobFormPageTwo } from "./CreateJobFormPage2";

export function CreateJobForm({ userId }: { userId: number }) {
  const form = useCreateJobForm(userId);

  return (
    <main className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">구인구직 글쓰기</h1>
            <span className="text-sm font-medium bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {form.step}/2
            </span>
          </div>

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
              workHours={form.workHours}
              setWorkHours={form.setWorkHours}
              mainTask={form.mainTask}
              setMainTask={form.setMainTask}
              preferred={form.preferred}
              setPreferred={form.setPreferred}
              handleNextStep={form.handleNextStep}
              handleBack={form.handleBack}
            />
          )}

          {form.step === 2 && (
            <CreateJobFormPageTwo
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
              setManagerName={form.setManagerName}
              managerTitle={form.managerTitle}
              setManagerTitle={form.setManagerTitle}
              managerPhone={form.managerPhone}
              setManagerPhone={form.setManagerPhone}
              managerEmail={form.managerEmail}
              setManagerEmail={form.setManagerEmail}
              isSubmitting={form.isSubmitting}
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
