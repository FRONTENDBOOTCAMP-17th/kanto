"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { TradeLocation } from "@/type/location";
import type { EmployeeType, SalaryType, JobInitialData } from "@/type/job/jobCreate";

export function useCreateJobForm(userId: number, userName: string, initialData?: JobInitialData) {
  const router = useRouter();
  const t = useTranslations("Job.form");
  const [step, setStep] = useState<1 | 2>(1);

  // 1단계: 채용 정보
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [employeeType, setEmployeeType] = useState<EmployeeType | "">(initialData?.employee_type as EmployeeType ?? "");
  const [salary, setSalary] = useState(initialData?.salary?.toString() ?? "");
  const [salaryType, setSalaryType] = useState<SalaryType | "">(initialData?.salary_type as SalaryType ?? "");
  const [locationType, setLocationType] = useState<TradeLocation | "">(initialData?.location_type as TradeLocation ?? "");
  const [locationCustom, setLocationCustom] = useState(initialData?.location_custom ?? "");
  const [deadline, setDeadline] = useState(initialData?.deadline ?? "");
  const [workHoursStart, setWorkHoursStart] = useState(() => (initialData?.work_hours ?? "").split(" - ")[0] ?? "");
  const [workHoursEnd, setWorkHoursEnd] = useState(() => (initialData?.work_hours ?? "").split(" - ")[1] ?? "");
  const [mainTask, setMainTask] = useState(initialData?.main_task ?? "");
  const [preferred, setPreferred] = useState(initialData?.preferred ?? "");

  // 2단계: 회사 및 담당자 정보
  const [companyName, setCompanyName] = useState(initialData?.company_name ?? "");
  const [companyIntro, setCompanyIntro] = useState(initialData?.company_intro ?? "");
  const [industry, setIndustry] = useState(initialData?.industry ?? "");
  const [companyYear, setCompanyYear] = useState(initialData?.company_year?.toString() ?? "");
  const [employeeCount, setEmployeeCount] = useState(initialData?.employee_count?.toString() ?? "");
  const [companyAddress, setCompanyAddress] = useState(initialData?.company_address ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(initialData?.company_website ?? "");
  const [managerName, setManagerName] = useState(userName);
  const [managerTitle, setManagerTitle] = useState(initialData?.manager_title ?? "");
  const [managerPhone, setManagerPhone] = useState(initialData?.manager_phone ?? "");
  const [managerEmail, setManagerEmail] = useState(initialData?.manager_email ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageUpload = useImageUpload(initialData?.images as string[] ?? []);


  const handleNextStep = () => {
    if (!title || !employeeType || !salary || !locationType || !deadline || !workHoursStart || !workHoursEnd || !mainTask) {
      alert(t("errorRequired"));
      return;
    }
    if (locationType === "그 외 지역" && !locationCustom) {
      alert(t("errorLocationDetail"));
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!companyName || !companyIntro || !managerName) {
      alert(t("errorRequired"));
      return;
    }
    setIsSubmitting(true);

    const jobFields = {
      company_name: companyName,
      company_intro: companyIntro,
      industry: industry || null,
      location_type: locationType as TradeLocation,
      location_custom: locationType === "그 외 지역" ? locationCustom : null,
      main_task: mainTask,
      employee_type: employeeType as EmployeeType,
      salary: Number(salary),
      salary_type: salaryType || null,
      work_hours: `${workHoursStart} - ${workHoursEnd}`,
      company_year: companyYear ? Number(companyYear) : null,
      employee_count: employeeCount ? Number(employeeCount) : null,
      company_address: companyAddress || null,
      company_website: companyWebsite || null,
      preferred: preferred || null,
      deadline,
      manager_name: managerName,
      manager_title: managerTitle || null,
      manager_phone: managerPhone || null,
      manager_email: managerEmail || null,
    };

    // 수정 모드
    if (initialData?.post_id) {
      const uploadedUrls: string[] = [];
      for (const file of imageUpload.imageFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const filePath = `${userId}/${initialData.post_id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file);
        if (uploadError) {
          alert(t("errorImage"));
          setIsSubmitting(false);
          return;
        }
        const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath);
        uploadedUrls.push(urlData.publicUrl);
      }

      const existingUrls = imageUpload.imagePreviews.filter(url => !url.startsWith("blob:"));
      const finalImages = [...existingUrls, ...uploadedUrls];

      await supabase.from("posts").update({ title }).eq("id", initialData.post_id);
      const { error } = await supabase.from("jobs")
        .update({ ...jobFields, images: finalImages.length > 0 ? finalImages : null })
        .eq("post_id", initialData.post_id);

      if (error) {
        alert(t("errorEdit"));
        setIsSubmitting(false);
        return;
      }

      router.replace(`/job/${initialData.post_id}`);
      return;
    }

    // 등록 모드
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({ user_id: userId, post_type: "jobs", title, status: "active", view_count: 0, like_count: 0 })
      .select("id")
      .single();

    if (postError || !post) {
      alert(t("errorPost"));
      setIsSubmitting(false);
      return;
    }

    const uploadedUrls: string[] = [];
    for (const file of imageUpload.imageFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filePath = `${userId}/${post.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file);
      if (uploadError) {
        await supabase.from("posts").delete().eq("id", post.id);
        alert(t("errorImage"));
        setIsSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath);
      uploadedUrls.push(urlData.publicUrl);
    }

    const { error: jobError } = await supabase.from("jobs").insert({
      post_id: post.id,
      ...jobFields,
      images: uploadedUrls.length > 0 ? uploadedUrls : null,
    });

    if (jobError) {
      await supabase.from("posts").delete().eq("id", post.id);
      alert(t("errorJob"));
      setIsSubmitting(false);
      return;
    }

    router.push("/job");
  };

  return {
    step,
    // 1단계
    title, setTitle,
    employeeType, setEmployeeType,
    salary, setSalary,
    salaryType, setSalaryType,
    locationType, setLocationType,
    locationCustom, setLocationCustom,
    deadline, setDeadline,
    workHoursStart, setWorkHoursStart,
    workHoursEnd, setWorkHoursEnd,
    mainTask, setMainTask,
    preferred, setPreferred,
    handleNextStep,
    // 2단계
    companyName, setCompanyName,
    companyIntro, setCompanyIntro,
    industry, setIndustry,
    companyYear, setCompanyYear,
    employeeCount, setEmployeeCount,
    companyAddress, setCompanyAddress,
    companyWebsite, setCompanyWebsite,
    managerName, setManagerName,
    managerTitle, setManagerTitle,
    managerPhone, setManagerPhone,
    managerEmail, setManagerEmail,
    isSubmitting,
    imageUpload,
    handleSubmit,
    handleBack: () => router.back(),
    handlePrevStep: () => { setStep(1); window.scrollTo(0, 0); },
  };
}
