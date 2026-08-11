import { supabase } from "@/lib/supabase";
import { optimizeImage } from "@/utils/optimizeImage";
import { buildImageOrder } from "@/utils/reorderImages";
import type { TradeLocation } from "@/type/location";
import type { EmployeeType, SalaryType, JobInitialData } from "@/type/job/jobCreate";
import type { PickedLocation } from "@/type/go";
import { createJobPostRecord } from "@/app/(user)/job/create/actions";

export interface SubmitJobPostParams {
  userId: number;
  initialData?: JobInitialData;
  checkText: string;

  title: string;
  mainTask: string;
  employeeType: EmployeeType | "";
  salary: string;
  salaryType: SalaryType | "";
  locationType: TradeLocation | "";
  locationCustom: string;
  deadline: string;
  workHoursStart: string;
  workHoursEnd: string;
  workDays: string[];
  isTimeNegotiable: boolean;
  preferred: string;
  preferredTags: string[];

  companyName: string;
  companyIntro: string;
  industry: string;
  companyYear: string;
  employeeCount: string;
  companyAddress: string;
  companyLocation: PickedLocation | null;
  companyWebsite: string;
  managerName: string;
  managerTitle: string;
  managerPhone: string;
  managerEmail: string;
  companyLogoUrl: string;
  companyLogoFile: File | null;

  imageFiles: File[];
  imagePreviews: string[];
}

export type SubmitJobPostResult =
  | { status: "success"; mode: "create" | "edit"; redirectTo: string }
  | { status: "error"; kind: "rate-limit" | "unauthorized" | "profanity" | "image" | "edit" | "post" | "job" };

function buildJobFields(params: SubmitJobPostParams, resolvedAddress: string) {
  return {
    company_name: params.companyName,
    company_intro: params.companyIntro,
    industry: params.industry || null,
    location_type: params.locationType as TradeLocation,
    location_custom: params.locationCustom || null,
    main_task: params.mainTask,
    employee_type: params.employeeType as EmployeeType,
    salary: Number(params.salary),
    salary_type: params.salaryType || null,
    work_hours: params.isTimeNegotiable ? null : `${params.workHoursStart} - ${params.workHoursEnd}`,
    work_days: params.isTimeNegotiable ? null : params.workDays,
    is_time_negotiable: params.isTimeNegotiable,
    company_year: params.companyYear ? Number(params.companyYear) : null,
    employee_count: params.employeeCount ? Number(params.employeeCount) : null,
    company_address: resolvedAddress || null,
    company_lat: params.companyLocation?.lat ?? params.initialData?.company_lat ?? null,
    company_lng: params.companyLocation?.lng ?? params.initialData?.company_lng ?? null,
    company_website: params.companyWebsite || null,
    preferred: params.preferred || null,
    preferred_tags: params.preferredTags.length > 0 ? params.preferredTags : null,
    deadline: params.deadline,
    manager_name: params.managerName,
    manager_title: params.managerTitle || null,
    manager_phone: params.managerPhone || null,
    manager_email: params.managerEmail || null,
  };
}

async function uploadCompanyLogo(
  userId: number,
  postId: number,
  file: File | null,
  existingUrl: string,
): Promise<{ ok: true; url: string | null } | { ok: false }> {
  if (!file) return { ok: true, url: existingUrl || null };
  const optimized = await optimizeImage(file, 512);
  const ext = optimized.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const logoPath = `logos/${userId}/${postId}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(logoPath, optimized, { upsert: true });
  if (error) return { ok: false };
  const { data } = supabase.storage.from("images").getPublicUrl(logoPath);
  return { ok: true, url: data.publicUrl };
}

async function uploadGalleryImages(
  userId: number,
  postId: number,
  files: File[],
): Promise<{ ok: true; urls: string[] } | { ok: false }> {
  const uploadedUrls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${userId}/${postId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("images").upload(filePath, file, { cacheControl: "31536000" });
    if (error) return { ok: false };
    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    uploadedUrls.push(data.publicUrl);
  }
  return { ok: true, urls: uploadedUrls };
}

async function submitEdit(
  params: SubmitJobPostParams,
  postId: number,
  jobFields: ReturnType<typeof buildJobFields>,
): Promise<SubmitJobPostResult> {
  const logo = await uploadCompanyLogo(params.userId, postId, params.companyLogoFile, params.companyLogoUrl);
  if (params.companyLogoFile && !logo.ok) {
    return { status: "error", kind: "image" };
  }
  const logoUrl = logo.ok ? logo.url : null;

  const gallery = await uploadGalleryImages(params.userId, postId, params.imageFiles);
  if (!gallery.ok) {
    return { status: "error", kind: "image" };
  }

  const finalImages = buildImageOrder(params.imagePreviews, gallery.urls);

  await supabase.from("posts").update({ title: params.title }).eq("id", postId);
  const { error } = await supabase
    .from("jobs")
    .update({ ...jobFields, company_logo: logoUrl, images: finalImages.length > 0 ? finalImages : null })
    .eq("post_id", postId);

  if (error) {
    return { status: "error", kind: "edit" };
  }

  return { status: "success", mode: "edit", redirectTo: `/job/${postId}` };
}

async function submitCreate(
  params: SubmitJobPostParams,
  jobFields: ReturnType<typeof buildJobFields>,
): Promise<SubmitJobPostResult> {
  let postId: number;
  try {
    const created = await createJobPostRecord(params.title, params.checkText);
    postId = created.postId;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "RATE_LIMIT") return { status: "error", kind: "rate-limit" };
    if (msg === "PROFANITY") return { status: "error", kind: "profanity" };
    if (msg === "UNAUTHORIZED") return { status: "error", kind: "unauthorized" };
    return { status: "error", kind: "post" };
  }

  const logo = await uploadCompanyLogo(params.userId, postId, params.companyLogoFile, params.companyLogoUrl);
  if (params.companyLogoFile && !logo.ok) {
    await supabase.from("posts").delete().eq("id", postId);
    return { status: "error", kind: "image" };
  }
  const logoUrl = logo.ok ? logo.url : null;

  const gallery = await uploadGalleryImages(params.userId, postId, params.imageFiles);
  if (!gallery.ok) {
    await supabase.from("posts").delete().eq("id", postId);
    return { status: "error", kind: "image" };
  }

  const { error: jobError } = await supabase.from("jobs").insert({
    post_id: postId,
    ...jobFields,
    company_logo: logoUrl,
    images: gallery.urls.length > 0 ? gallery.urls : null,
  });

  if (jobError) {
    await supabase.from("posts").delete().eq("id", postId);
    return { status: "error", kind: "job" };
  }

  return { status: "success", mode: "create", redirectTo: "/job" };
}

export async function submitJobPost(params: SubmitJobPostParams): Promise<SubmitJobPostResult> {
  const resolvedAddress = params.companyLocation?.address ?? params.companyAddress;
  const jobFields = buildJobFields(params, resolvedAddress);

  if (params.initialData?.post_id) {
    return submitEdit(params, params.initialData.post_id, jobFields);
  }
  return submitCreate(params, jobFields);
}
