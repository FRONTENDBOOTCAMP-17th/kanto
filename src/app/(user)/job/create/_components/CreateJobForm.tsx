"use client";

import { useState, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { TRADE_LOCATIONS, type TradeLocation } from "@/type/location";

const EMPLOYEE_TYPES = ["정규직", "계약직", "파트타임"] as const;
const SALARY_TYPES = ["시급", "주급", "월급"] as const;

type EmployeeType = (typeof EMPLOYEE_TYPES)[number];
type SalaryType = (typeof SALARY_TYPES)[number];

export function CreateJobForm({ userId }: { userId: number }) {
  const router = useRouter();

  // 폼 입력값 상태
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyIntro, setCompanyIntro] = useState("");
  const [locationType, setLocationType] = useState<TradeLocation | "">("");
  const [locationCustom, setLocationCustom] = useState("");
  const [mainTask, setMainTask] = useState("");
  const [employeeType, setEmployeeType] = useState<EmployeeType | "">("");
  const [salary, setSalary] = useState("");
  const [salaryType, setSalaryType] = useState<SalaryType | "">("");
  const [workHours, setWorkHours] = useState("");
  const [companyYear, setCompanyYear] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [preferred, setPreferred] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contact, setContact] = useState("");
  const [managerTitle, setManagerTitle] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]); // 실제 업로드할 파일 목록
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // 미리보기 URL 목록
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 폼 제출: posts → 이미지 업로드 → jobs 순서로 DB에 저장

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!locationType) return;
    setIsSubmitting(true);

    // posts 테이블에 공통 게시글 정보 먼저 저장
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

    //  이미지 파일을 Storage에 업로드하고
    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const filePath = `${userId}/${post.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) {
        // 이미지 업로드 실패 시 방금 만든 posts 행도 같이 삭제
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

    //  Jobs 테이블에 구인구직 상세 정보 저장
    const { error: jobError } = await supabase.from("jobs").insert({
      post_id: post.id,
      company_name: companyName,
      company_intro: companyIntro,
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
      contact: contact || null,
      manager_title: managerTitle || null,
      images: uploadedUrls.length > 0 ? uploadedUrls : null,
    });

    if (jobError) {
      alert("공고 등록에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    router.push("/jobs");
  };

  const formatSalaryInput = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    if (raw === "" || /^\d+$/.test(raw)) setSalary(raw);
  };

  // 숨겨진 파일 input 클릭 트리거 (사진 추가 버튼 누를 때)
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  // 파일 선택 시 미리보기 URL 생성 및 목록 추가 (최대 10장 제한)
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from<File>(e.target.files ?? []);
    const remaining = 10 - imageFiles.length;
    const allowedFiles = files.slice(0, remaining);

    setImageFiles((prev) => [...prev, ...allowedFiles]);
    setImagePreviews((prev) => [
      ...prev,
      ...allowedFiles.map((file) => URL.createObjectURL(file)),
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
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            구인구직 글쓰기
          </h1>
          <p className="text-gray-600 mb-8">필요한 정보를 입력해주세요</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 채용 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">채용 정보</h3>
              <div className="space-y-2">
                <Label htmlFor="title">공고 제목 *</Label>
                <Input
                  id="title"
                  placeholder="예: 한식당 홀 서빙 직원 구합니다"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeType">고용 형태 *</Label>
                <Select
                  value={employeeType}
                  onValueChange={(v) => setEmployeeType(v as EmployeeType)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="고용 형태를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
                      onChange={formatSalaryInput}
                      className="pr-12"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      PHP
                    </span>
                  </div>
                  <Select
                    value={salaryType}
                    onValueChange={(v) => setSalaryType(v as SalaryType)}
                  >
                    <SelectTrigger className="w-28">
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
                <Label htmlFor="region">근무 지역 *</Label>
                <Select
                  value={locationType}
                  onValueChange={(v) => setLocationType(v as TradeLocation)}
                  required
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
                {/* 그 외 지역 선택 시 상세 입력 필드 표시 */}
                {locationType === "그 외 지역" && (
                  <Input
                    placeholder="상세 지역을 입력하세요"
                    value={locationCustom}
                    onChange={(e) => setLocationCustom(e.target.value)}
                    required
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workHours">근무 시간 *</Label>
                <Input
                  id="workHours"
                  placeholder="예: 09:00 - 18:00"
                  value={workHours}
                  onChange={(e) => setWorkHours(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 상세 내용 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">상세 내용</h3>
              <div className="space-y-2">
                <Label htmlFor="mainTask">주요 업무 *</Label>
                <Textarea
                  id="mainTask"
                  placeholder="주요 업무를 입력하세요"
                  value={mainTask}
                  onChange={(e) => setMainTask(e.target.value)}
                  rows={4}
                  required
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
              <div className="space-y-2">
                <Label htmlFor="contact">연락 방법</Label>
                <Input
                  id="contact"
                  placeholder="이메일, 전화번호 등"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>
            </div>

            {/* 사진 업로드 */}
            <div className="space-y-2">
              <Label>사진 (최대 10장)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <div className="space-y-3">
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-3">
                    {imagePreviews.map((img, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={img}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {imagePreviews.length < 10 && (
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-teal-500 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm">사진 추가하기</span>
                      <span className="text-xs">
                        ({imagePreviews.length}/10)
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* 회사 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">회사 정보</h3>
              <div className="space-y-2">
                <Label htmlFor="companyName">회사명 *</Label>
                <Input
                  id="companyName"
                  placeholder="회사명을 입력하세요"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyIntro">회사 소개 *</Label>
                <Textarea
                  id="companyIntro"
                  placeholder="회사에 대한 소개를 입력하세요"
                  value={companyIntro}
                  onChange={(e) => setCompanyIntro(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyYear">설립연도</Label>
                  <Input
                    id="companyYear"
                    placeholder="예: 2018"
                    type="number"
                    value={companyYear}
                    onChange={(e) => setCompanyYear(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeCount">직원 수</Label>
                  <Input
                    id="employeeCount"
                    placeholder="예: 30"
                    type="number"
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
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">담당자 정보</h3>
              <div className="space-y-2">
                <Label htmlFor="managerTitle">담당자 직함</Label>
                <Input
                  id="managerTitle"
                  placeholder="예: 매니저, HR 담당자"
                  value={managerTitle}
                  onChange={(e) => setManagerTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-teal-500 hover:bg-teal-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? "등록 중..." : "작성 완료"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
