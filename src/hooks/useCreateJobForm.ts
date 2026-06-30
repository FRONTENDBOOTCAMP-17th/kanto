"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { TradeLocation } from "@/type/location";
import type { EmployeeType, SalaryType, JobInitialData } from "@/type/job/jobCreate";
import type { PickedLocation } from "@/type/go";

export function useCreateJobForm(userId: number, userName: string, initialData?: JobInitialData) {
  const router = useRouter();
  const t = useTranslations("Job.form");
  const [step, setStep] = useState<1 | 2>(1);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [employeeType, setEmployeeType] = useState<EmployeeType | "">(initialData?.employee_type as EmployeeType ?? "");
  const [salary, setSalary] = useState(initialData?.salary?.toString() ?? "");
  const [salaryType, setSalaryType] = useState<SalaryType | "">(initialData?.salary_type as SalaryType ?? "");
  const [locationType, setLocationType] = useState<TradeLocation | "">(initialData?.location_type as TradeLocation ?? "");
  const [locationCustom, setLocationCustom] = useState(initialData?.location_custom ?? "");
  const [deadline, setDeadline] = useState(initialData?.deadline ?? "");
  const [workHoursStart, setWorkHoursStart] = useState(() => (initialData?.work_hours ?? "").split(" - ")[0] || "00:00");
  const [workHoursEnd, setWorkHoursEnd] = useState(() => (initialData?.work_hours ?? "").split(" - ")[1] || "00:00");
  const [workDays, setWorkDays] = useState<string[]>(initialData?.work_days ?? []);
  const [isTimeNegotiable, setIsTimeNegotiable] = useState(initialData?.is_time_negotiable ?? false);
  const [mainTask, setMainTask] = useState(initialData?.main_task ?? "");
  const [preferred, setPreferred] = useState(initialData?.preferred ?? "");
  const [preferredTags, setPreferredTags] = useState<string[]>(initialData?.preferred_tags ?? []);

  const [companyName, setCompanyName] = useState(initialData?.company_name ?? "");
  const [companyIntro, setCompanyIntro] = useState(initialData?.company_intro ?? "");
  const [industry, setIndustry] = useState(initialData?.industry ?? "");
  const [companyYear, setCompanyYear] = useState(initialData?.company_year?.toString() ?? "");
  const [employeeCount, setEmployeeCount] = useState(initialData?.employee_count?.toString() ?? "");
  const [companyAddress, setCompanyAddress] = useState(initialData?.company_address ?? "");
  
  const [companyLocation, setCompanyLocation] = useState<PickedLocation | null>(
    initialData?.company_lat != null && initialData?.company_lng != null
      ? {
          lat: initialData.company_lat,
          lng: initialData.company_lng,
          address: initialData.company_address ?? "",
        }
      : null,
  );
  const [companyWebsite, setCompanyWebsite] = useState(initialData?.company_website ?? "");
  const [managerName, setManagerName] = useState(userName);
  const [managerTitle, setManagerTitle] = useState(initialData?.manager_title ?? "");
  const [managerPhone, setManagerPhone] = useState(initialData?.manager_phone ?? "");
  const [managerEmail, setManagerEmail] = useState(initialData?.manager_email ?? "");
  const [companyLogoUrl, setCompanyLogoUrl] = useState(initialData?.company_logo ?? "");
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState("");
  const imageUpload = useImageUpload(initialData?.images as string[] ?? []);
  const maxUrlsRef = useRef(3);

  useEffect(() => {
    fetch("/api/admin/spam-config")
      .then((r) => r.json())
      .then((d) => { if (d?.max_urls_per_post != null) maxUrlsRef.current = d.max_urls_per_post; })
      .catch(() => {});
  }, []);

  const isStep1Valid =
    title.trim().length >= 2 &&
    employeeType !== "" &&
    salary !== "" &&
    salaryType !== "" &&
    locationType !== "" &&
    (locationType !== "그 외 지역" || locationCustom.trim() !== "") &&
    deadline !== "" &&
    (isTimeNegotiable || (!!workHoursStart && !!workHoursEnd)) &&
    mainTask.trim().length >= 10;

  const isStep2Valid =
    companyName.trim() !== "" &&
    companyIntro.trim() !== "";

  const handleNextStep = () => {
    if (!isTimeNegotiable && (!workHoursStart || !workHoursEnd)) {
      alert("근무 시간을 입력하거나 시간 협의를 선택해주세요.");
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    
    const resolvedAddress = companyLocation?.address ?? companyAddress;
    if (
      !industry.trim() ||
      !resolvedAddress.trim() ||
      !companyWebsite.trim() ||
      !managerTitle.trim() ||
      !managerPhone.trim() ||
      !managerEmail.trim()
    ) {
      alert("업종, 주소, 웹사이트, 담당자 직함, 전화번호, 이메일을 모두 입력해주세요.");
      return;
    }

    const checkText = [mainTask, companyIntro].join(" ");
    const urlCount = (checkText.match(/https?:\/\/[^\s]+/g) ?? []).length;
    if (urlCount > maxUrlsRef.current) {
      setUrlError(`게시물에 URL은 최대 ${maxUrlsRef.current}개까지 허용됩니다.`);
      return;
    }
    setUrlError("");
    setIsSubmitting(true);

    const uploadLogo = async (postId: number): Promise<string | null> => {
      if (!companyLogoFile) return companyLogoUrl || null;
      const ext = companyLogoFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const logoPath = `logos/${userId}/${postId}.${ext}`;
      const { error } = await supabase.storage.from("images").upload(logoPath, companyLogoFile, { upsert: true });
      if (error) { alert(t("errorImage")); return null; }
      const { data } = supabase.storage.from("images").getPublicUrl(logoPath);
      return data.publicUrl;
    };

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
      work_hours: isTimeNegotiable ? null : `${workHoursStart} - ${workHoursEnd}`,
      work_days: isTimeNegotiable ? null : workDays,
      is_time_negotiable: isTimeNegotiable,
      company_year: companyYear ? Number(companyYear) : null,
      employee_count: employeeCount ? Number(employeeCount) : null,
      company_address: resolvedAddress || null,
      company_lat: companyLocation?.lat ?? initialData?.company_lat ?? null,
      company_lng: companyLocation?.lng ?? initialData?.company_lng ?? null,
      company_website: companyWebsite || null,
      preferred: preferred || null,
      preferred_tags: preferredTags.length > 0 ? preferredTags : null,
      deadline,
      manager_name: managerName,
      manager_title: managerTitle || null,
      manager_phone: managerPhone || null,
      manager_email: managerEmail || null,
    };

    if (initialData?.post_id) {
      const logoUrl = await uploadLogo(initialData.post_id);
      if (companyLogoFile && !logoUrl) { setIsSubmitting(false); return; }

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
        .update({ ...jobFields, company_logo: logoUrl, images: finalImages.length > 0 ? finalImages : null })
        .eq("post_id", initialData.post_id);

      if (error) {
        alert(t("errorEdit"));
        setIsSubmitting(false);
        return;
      }

      router.replace(`/job/${initialData.post_id}`);
      return;
    }

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

    const logoUrl = await uploadLogo(post.id);
    if (companyLogoFile && !logoUrl) {
      await supabase.from("posts").delete().eq("id", post.id);
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
      company_logo: logoUrl,
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
    title, setTitle,
    employeeType, setEmployeeType,
    salary, setSalary,
    salaryType, setSalaryType,
    locationType, setLocationType,
    locationCustom, setLocationCustom,
    deadline, setDeadline,
    workHoursStart, setWorkHoursStart,
    workHoursEnd, setWorkHoursEnd,
    workDays, setWorkDays,
    isTimeNegotiable, setIsTimeNegotiable,
    mainTask, setMainTask,
    preferred, setPreferred,
    preferredTags, setPreferredTags,
    isStep1Valid,
    isStep2Valid,
    handleNextStep,
    companyName, setCompanyName,
    companyIntro, setCompanyIntro,
    industry, setIndustry,
    companyYear, setCompanyYear,
    employeeCount, setEmployeeCount,
    companyAddress, setCompanyAddress,
    companyLocation, setCompanyLocation,
    companyWebsite, setCompanyWebsite,
    managerName, setManagerName,
    managerTitle, setManagerTitle,
    managerPhone, setManagerPhone,
    managerEmail, setManagerEmail,
    companyLogoUrl, setCompanyLogoUrl,
    companyLogoFile, setCompanyLogoFile,
    isSubmitting,
    urlError,
    imageUpload,
    handleSubmit,
    handleBack: () => router.back(),
    handlePrevStep: () => { setStep(1); window.scrollTo(0, 0); },
  };
}
