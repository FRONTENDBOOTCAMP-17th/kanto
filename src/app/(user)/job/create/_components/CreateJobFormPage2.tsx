"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import { useImageUpload } from "@/hooks/useImageUpload";

const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/i;

interface CreateJobFormPageTwoProps {
  companyName: string; setCompanyName: (v: string) => void;
  companyIntro: string; setCompanyIntro: (v: string) => void;
  industry: string; setIndustry: (v: string) => void;
  companyYear: string; setCompanyYear: (v: string) => void;
  employeeCount: string; setEmployeeCount: (v: string) => void;
  companyAddress: string; setCompanyAddress: (v: string) => void;
  companyWebsite: string; setCompanyWebsite: (v: string) => void;
  managerName: string;
  managerTitle: string; setManagerTitle: (v: string) => void;
  managerPhone: string; setManagerPhone: (v: string) => void;
  managerEmail: string; setManagerEmail: (v: string) => void;
  isSubmitting: boolean;
  imageUpload: ReturnType<typeof useImageUpload>;
  handleSubmit: () => void;
  handlePrevStep: () => void;
}

export function CreateJobFormPageTwo({
  companyName, setCompanyName,
  companyIntro, setCompanyIntro,
  industry, setIndustry,
  companyYear, setCompanyYear,
  employeeCount, setEmployeeCount,
  companyAddress, setCompanyAddress,
  companyWebsite, setCompanyWebsite,
  managerName,
  managerTitle, setManagerTitle,
  managerPhone, setManagerPhone,
  managerEmail, setManagerEmail,
  isSubmitting,
  imageUpload,
  handleSubmit,
  handlePrevStep,
}: CreateJobFormPageTwoProps) {
  const [websiteError, setWebsiteError] = useState("");

  const handleWebsiteBlur = () => {
    if (companyWebsite && !URL_REGEX.test(companyWebsite)) {
      setWebsiteError("올바른 웹사이트 주소를 입력해주세요 (예: https://company.com)");
    } else {
      setWebsiteError("");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-500">회사 정보와 담당자 연락처를 입력해주세요</p>

      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">회사 정보</h2>
        <div className="space-y-2">
          <Label htmlFor="companyName">회사명 *</Label>
          <Input id="companyName" placeholder="회사명을 입력하세요" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyIntro">회사 소개 *</Label>
          <Textarea id="companyIntro" placeholder="회사에 대한 소개를 입력하세요" value={companyIntro} onChange={(e) => setCompanyIntro(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">업종</Label>
          <Input id="industry" placeholder="예: 음식점업" value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyYear">설립연도</Label>
            <Input id="companyYear" inputMode="numeric" placeholder="예: 2018" value={companyYear} onChange={(e) => setCompanyYear(e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeCount">직원 수</Label>
            <Input id="employeeCount" inputMode="numeric" placeholder="예: 10" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value.replace(/\D/g, ""))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyAddress">주소</Label>
          <Input id="companyAddress" placeholder="회사 주소를 입력하세요" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyWebsite">웹사이트</Label>
          <Input
            id="companyWebsite"
            placeholder="예: https://company.com"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            onBlur={handleWebsiteBlur}
          />
          {websiteError && <p className="text-xs text-red-500">{websiteError}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">담당자 정보</h2>
        <div className="space-y-2">
          <Label htmlFor="managerName">담당자 이름 *</Label>
          <Input
            id="managerName"
            value={managerName}
            readOnly
            className="bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="managerTitle">담당자 직함</Label>
          <Input id="managerTitle" placeholder="예: 매니저, HR 담당자" value={managerTitle} onChange={(e) => setManagerTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="managerPhone">전화번호</Label>
          <Input id="managerPhone" placeholder="예: +63 917 123 4567" value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="managerEmail">이메일</Label>
          <Input id="managerEmail" type="email" placeholder="예: recruiter@company.com" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} />
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-4">
          사진 <span className="text-gray-400 font-normal text-sm">(선택사항)</span>
        </h2>
        <ImageUploadField
          fileInputRef={imageUpload.fileInputRef}
          imagePreviews={imageUpload.imagePreviews}
          onUploadClick={imageUpload.handleImageUpload}
          onSelect={imageUpload.handleImageSelect}
          onRemove={imageUpload.removeImage}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handlePrevStep} className="flex-1" disabled={isSubmitting}>이전 단계</Button>
        <Button type="button" variant="teal" onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "등록 중..." : "작성 완료"}
        </Button>
      </div>
    </div>
  );
}
