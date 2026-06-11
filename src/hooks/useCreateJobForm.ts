"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { TradeLocation } from "@/type/location";
import type { EmployeeType, SalaryType } from "@/type/job/jobCreate";

export function useCreateJobForm(userId: number) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // 1단계: 채용 정보
  const [title, setTitle] = useState("");
  const [employeeType, setEmployeeType] = useState<EmployeeType | "">("");
  const [salary, setSalary] = useState("");
  const [salaryType, setSalaryType] = useState<SalaryType | "">("");
  const [locationType, setLocationType] = useState<TradeLocation | "">("");
  const [locationCustom, setLocationCustom] = useState("");
  const [deadline, setDeadline] = useState("");
  const [workHours, setWorkHours] = useState("");
  const [mainTask, setMainTask] = useState("");
  const [preferred, setPreferred] = useState("");

  // 2단계: 회사 및 담당자 정보
  const [companyName, setCompanyName] = useState("");
  const [companyIntro, setCompanyIntro] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyYear, setCompanyYear] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerTitle, setManagerTitle] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageUpload = useImageUpload();

  const handleNextStep = () => {
    if (!title || !employeeType || !salary || !locationType || !deadline || !workHours || !mainTask) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (locationType === "그 외 지역" && !locationCustom) {
      alert("상세 지역을 입력해주세요.");
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!companyName || !companyIntro || !managerName) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }
    setIsSubmitting(true);

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        post_type: "jobs",
        title,
        status: "active",
        view_count: 0,
        like_count: 0,
      })
      .select("id")
      .single();

    if (postError || !post) {
      alert("게시글 등록에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    const uploadedUrls: string[] = [];
    for (const file of imageUpload.imageFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filePath = `${userId}/${post.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) {
        await supabase.from("posts").delete().eq("id", post.id);
        alert("이미지 업로드에 실패했습니다.");
        setIsSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath);
      uploadedUrls.push(urlData.publicUrl);
    }

    const { error: jobError } = await supabase.from("jobs").insert({
      post_id: post.id,
      company_name: companyName,
      company_intro: companyIntro,
      industry: industry || null,
      location_type: locationType as TradeLocation,
      location_custom: locationType === "그 외 지역" ? locationCustom : null,
      main_task: mainTask,
      employee_type: employeeType as EmployeeType,
      salary: Number(salary),
      salary_type: salaryType || null,
      work_hours: workHours,
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
      images: uploadedUrls.length > 0 ? uploadedUrls : null,
    });

    if (jobError) {
      alert("공고 등록에 실패했습니다.");
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
    workHours, setWorkHours,
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
