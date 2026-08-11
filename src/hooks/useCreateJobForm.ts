"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cityToTradeLocation, type TradeLocation } from "@/type/location";
import type { EmployeeType, SalaryType, JobInitialData } from "@/type/job/jobCreate";
import type { PickedLocation } from "@/type/go";
import { submitJobPost } from "@/app/(user)/job/create/_lib/submitJobPost";

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
  const [workLocation, setWorkLocation] = useState<PickedLocation | null>(null);

  const handleWorkLocationSelect = (loc: PickedLocation) => {
    setWorkLocation(loc);
    setLocationType(cityToTradeLocation(loc.city ?? null, loc.province ?? null));
    setLocationCustom(loc.address);
  };
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
  const [showProfanityToast, setShowProfanityToast] = useState(false);
  const profanityToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerProfanityToast = () => {
    if (profanityToastTimerRef.current) clearTimeout(profanityToastTimerRef.current);
    setShowProfanityToast(true);
    profanityToastTimerRef.current = setTimeout(() => setShowProfanityToast(false), 3000);
  };
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
    deadline !== "" &&
    (isTimeNegotiable || (!!workHoursStart && !!workHoursEnd)) &&
    mainTask.trim().length >= 10;

  const isStep2Valid =
    companyName.trim() !== "" &&
    companyIntro.trim() !== "";

  const handleNextStep = async () => {
    if (!isTimeNegotiable && (!workHoursStart || !workHoursEnd)) {
      alert("근무 시간을 입력하거나 시간 협의를 선택해주세요.");
      return;
    }
    const checkText = [title, mainTask].join(" ");
    const res = await fetch(`/api/admin/profanity-rules/check?text=${encodeURIComponent(checkText)}`).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (data?.blocked) {
      triggerProfanityToast();
      return;
    }
    setStep(2);
    document.getElementById("scroll-root")?.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
      router.push("/login");
      return;
    }

    const resolvedAddress = companyLocation?.address ?? companyAddress;
    if (
      !industry.trim() ||
      !resolvedAddress.trim() ||
      !managerTitle.trim() ||
      !managerPhone.trim() ||
      !managerEmail.trim()
    ) {
      alert("업종, 주소, 담당자 직함, 전화번호, 이메일을 모두 입력해주세요.");
      return;
    }

    const checkText = [title, mainTask, companyName, companyIntro].join(" ");

    const profanityRes = await fetch(`/api/admin/profanity-rules/check?text=${encodeURIComponent(checkText)}`).catch(() => null);
    const profanityData = profanityRes ? await profanityRes.json().catch(() => null) : null;
    if (profanityData?.blocked) {
      triggerProfanityToast();
      return;
    }

    const urlCount = (checkText.match(/https?:\/\/[^\s]+/g) ?? []).length;
    if (urlCount > maxUrlsRef.current) {
      setUrlError(`게시물에 URL은 최대 ${maxUrlsRef.current}개까지 허용됩니다.`);
      return;
    }
    setUrlError("");

    setIsSubmitting(true);
    const result = await submitJobPost({
      userId,
      initialData,
      checkText,
      title,
      mainTask,
      employeeType,
      salary,
      salaryType,
      locationType,
      locationCustom,
      deadline,
      workHoursStart,
      workHoursEnd,
      workDays,
      isTimeNegotiable,
      preferred,
      preferredTags,
      companyName,
      companyIntro,
      industry,
      companyYear,
      employeeCount,
      companyAddress,
      companyLocation,
      companyWebsite,
      managerName,
      managerTitle,
      managerPhone,
      managerEmail,
      companyLogoUrl,
      companyLogoFile,
      imageFiles: imageUpload.imageFiles,
      imagePreviews: imageUpload.imagePreviews,
    });
    setIsSubmitting(false);

    if (result.status === "success") {
      if (result.mode === "edit") router.replace(result.redirectTo);
      else router.push(result.redirectTo);
      return;
    }

    switch (result.kind) {
      case "rate-limit":
        alert("도배 방지를 위해 짧은 시간안에 글 작성을 금지하고 있습니다. 잠시 후 다시 시도해주세요.");
        break;
      case "profanity":
        triggerProfanityToast();
        break;
      case "unauthorized":
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
        router.push("/login");
        break;
      case "image":
        alert(t("errorImage"));
        break;
      case "edit":
        alert(t("errorEdit"));
        break;
      case "post":
        alert(t("errorPost"));
        break;
      case "job":
        alert(t("errorJob"));
        break;
    }
  };

  return {
    step,
    title, setTitle,
    employeeType, setEmployeeType,
    salary, setSalary,
    salaryType, setSalaryType,
    workLocation,
    handleWorkLocationSelect,
    locationFallbackLabel: locationCustom || locationType || null,
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
    showProfanityToast,
    imageUpload,
    handleSubmit,
    handleBack: () => router.back(),
    handlePrevStep: () => { setStep(1); document.getElementById("scroll-root")?.scrollTo(0, 0); },
  };
}
