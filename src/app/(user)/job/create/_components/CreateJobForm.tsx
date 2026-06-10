"use client";

import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { TRADE_LOCATIONS, type TradeLocation } from "@/type/location";
import {
  EMPLOYEE_TYPES,
  SALARY_TYPES,
  type EmployeeType,
  type SalaryType,
} from "@/type/job/jobCreate";

export function CreateJobForm({ userId }: { userId: number }) {
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNextStep = () => {
    if (
      !title ||
      !employeeType ||
      !salary ||
      !locationType ||
      !deadline ||
      !workHours ||
      !mainTask
    ) {
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
    for (const file of imageFiles) {
      const filePath = `${userId}/${post.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) {
        await supabase.from("posts").delete().eq("id", post.id);
        alert("이미지 업로드에 실패했습니다.");
        setIsSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);
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
      deadline: deadline,
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

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from<File>(e.target.files ?? []);
    const remaining = 10 - imageFiles.length;
    const allowed = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...allowed]);
    setImagePreviews((prev) => [
      ...prev,
      ...allowed.map((f) => URL.createObjectURL(f)),
    ]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <main className="flex-1 bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">구인구직 글쓰기</h1>
            <span className="text-sm font-medium bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {step}/2
            </span>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-500">채용 공고의 기본 정보를 입력해주세요</p>
              <h2 className="font-semibold text-gray-900">채용 정보</h2>

              <div className="space-y-2">
                <Label htmlFor="title">공고 제목 *</Label>
                <Input
                  id="title"
                  placeholder="예: 한식당 홀 서빙 직원 구합니다"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>고용 형태 *</Label>
                <Select
                  value={employeeType}
                  onValueChange={(v) => setEmployeeType(v as EmployeeType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="고용 형태를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>급여 *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={salary ? Number(salary).toLocaleString() : ""}
                      onChange={(e) => setSalary(e.target.value.replace(/,/g, ""))}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      PHP
                    </span>
                  </div>
                  <Select
                    value={salaryType}
                    onValueChange={(v) => setSalaryType(v as SalaryType)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="단위" />
                    </SelectTrigger>
                    <SelectContent>
                      {SALARY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>근무 지역 *</Label>
                <Select
                  value={locationType}
                  onValueChange={(v) => setLocationType(v as TradeLocation)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="지역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {locationType === "그 외 지역" && (
                  <Input
                    placeholder="상세 지역을 입력하세요"
                    value={locationCustom}
                    onChange={(e) => setLocationCustom(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">마감일 *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workHours">근무 시간 *</Label>
                <Input
                  id="workHours"
                  placeholder="예: 09:00 - 18:00"
                  value={workHours}
                  onChange={(e) => setWorkHours(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainTask">주요 업무 *</Label>
                <Textarea
                  id="mainTask"
                  placeholder="주요 업무를 입력하세요"
                  value={mainTask}
                  onChange={(e) => setMainTask(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred">우대 사항</Label>
                <Textarea
                  id="preferred"
                  placeholder="우대 사항을 입력하세요"
                  value={preferred}
                  onChange={(e) => setPreferred(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
                >
                  다음 단계
                </Button>
              </div>
            </div>
          )}

          {/* 2단계: 회사 및 담당자 정보 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-gray-500 mb-6">회사 정보와 담당자 연락처를 입력해주세요</p>

                {/* 회사 정보 */}
                <h2 className="font-semibold text-gray-900 mb-4">회사 및 담당자 정보</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">회사명 *</Label>
                    <Input
                      id="companyName"
                      placeholder="회사명을 입력하세요"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyIntro">회사 소개 *</Label>
                    <Textarea
                      id="companyIntro"
                      placeholder="회사에 대한 소개를 입력하세요"
                      value={companyIntro}
                      onChange={(e) => setCompanyIntro(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">업종</Label>
                    <Input
                      id="industry"
                      placeholder="예: 음식점업"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyYear">설립연도</Label>
                      <Input
                        id="companyYear"
                        placeholder="예: 2018년"
                        value={companyYear}
                        onChange={(e) => setCompanyYear(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">직원 수</Label>
                      <Input
                        id="employeeCount"
                        placeholder="예: 10-30명"
                        value={employeeCount}
                        onChange={(e) => setEmployeeCount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">주소</Label>
                    <Input
                      id="companyAddress"
                      placeholder="회사 주소를 입력하세요"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">웹사이트</Label>
                    <Input
                      id="companyWebsite"
                      placeholder="예: www.company.com"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                    />
                  </div>
                </div>

                {/* 담당자 정보 */}
                <h2 className="font-semibold text-gray-900 mt-8 mb-4">담당자 정보</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerName">담당자 이름 *</Label>
                    <Input
                      id="managerName"
                      placeholder="예: 김철수"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerTitle">담당자 직함</Label>
                    <Input
                      id="managerTitle"
                      placeholder="예: 매니저, HR 담당자"
                      value={managerTitle}
                      onChange={(e) => setManagerTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerPhone">전화번호</Label>
                    <Input
                      id="managerPhone"
                      placeholder="예: +63 917 123 4567"
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerEmail">이메일</Label>
                    <Input
                      id="managerEmail"
                      type="email"
                      placeholder="예: recruiter@company.com"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* 사진 */}
                <h2 className="font-semibold text-gray-900 mt-8 mb-4">
                  사진 <span className="text-gray-400 font-normal text-sm">(선택사항)</span>
                </h2>
                <ImageUploadField
                  fileInputRef={fileInputRef}
                  imagePreviews={imagePreviews}
                  onUploadClick={() => fileInputRef.current?.click()}
                  onSelect={handleImageSelect}
                  onRemove={removeImage}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setStep(1); window.scrollTo(0, 0); }}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  이전 단계
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "등록 중..." : "작성 완료"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
