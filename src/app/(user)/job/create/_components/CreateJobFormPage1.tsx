"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRADE_LOCATIONS, type TradeLocation } from "@/type/location";
import { EMPLOYEE_TYPES, SALARY_TYPES, type EmployeeType, type SalaryType } from "@/type/job/jobCreate";

interface CreateJobFormPageOneProps {
  title: string; setTitle: (v: string) => void;
  employeeType: EmployeeType | ""; setEmployeeType: (v: EmployeeType | "") => void;
  salary: string; setSalary: (v: string) => void;
  salaryType: SalaryType | ""; setSalaryType: (v: SalaryType | "") => void;
  locationType: TradeLocation | ""; setLocationType: (v: TradeLocation | "") => void;
  locationCustom: string; setLocationCustom: (v: string) => void;
  deadline: string; setDeadline: (v: string) => void;
  workHoursStart: string; setWorkHoursStart: (v: string) => void;
  workHoursEnd: string; setWorkHoursEnd: (v: string) => void;
  mainTask: string; setMainTask: (v: string) => void;
  preferred: string; setPreferred: (v: string) => void;
  handleNextStep: () => void;
  handleBack: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "30"];

export function CreateJobFormPageOne({
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
  handleBack,
}: CreateJobFormPageOneProps) {
  return (
    <div className="space-y-4">
      <p className="text-gray-500">채용 공고의 기본 정보를 입력해주세요</p>
      <h2 className="font-semibold text-gray-900">채용 정보</h2>

      <div className="space-y-2">
        <Label htmlFor="title">공고 제목 *</Label>
        <Input id="title" placeholder="예: 한식당 홀 서빙 직원 구합니다" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>고용 형태 *</Label>
        <Select value={employeeType} onValueChange={(v) => setEmployeeType(v as EmployeeType)}>
          <SelectTrigger><SelectValue placeholder="고용 형태를 선택하세요" /></SelectTrigger>
          <SelectContent>
            {EMPLOYEE_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">PHP</span>
          </div>
          <Select value={salaryType} onValueChange={(v) => setSalaryType(v as SalaryType)}>
            <SelectTrigger className="w-24"><SelectValue placeholder="단위" /></SelectTrigger>
            <SelectContent>
              {SALARY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>근무 지역 *</Label>
        <Select value={locationType} onValueChange={(v) => setLocationType(v as TradeLocation)}>
          <SelectTrigger><SelectValue placeholder="지역을 선택하세요" /></SelectTrigger>
          <SelectContent>
            {TRADE_LOCATIONS.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {locationType === "그 외 지역" && (
          <Input placeholder="상세 지역을 입력하세요" value={locationCustom} onChange={(e) => setLocationCustom(e.target.value)} />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">마감일 *</Label>
        <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>근무 시간 *</Label>
        <div className="flex items-center gap-2">
          <Select value={workHoursStart.split(":")[0] ?? ""} onValueChange={(h) => setWorkHoursStart(`${h}:${workHoursStart.split(":")[1] ?? "00"}`)}>
            <SelectTrigger className="w-20"><SelectValue placeholder="시" /></SelectTrigger>
            <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{h}시</SelectItem>)}</SelectContent>
          </Select>
          <Select value={workHoursStart.split(":")[1] ?? ""} onValueChange={(m) => setWorkHoursStart(`${workHoursStart.split(":")[0] ?? "00"}:${m}`)}>
            <SelectTrigger className="w-20"><SelectValue placeholder="분" /></SelectTrigger>
            <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={m}>{m}분</SelectItem>)}</SelectContent>
          </Select>
          <span className="text-gray-500">~</span>
          <Select value={workHoursEnd.split(":")[0] ?? ""} onValueChange={(h) => setWorkHoursEnd(`${h}:${workHoursEnd.split(":")[1] ?? "00"}`)}>
            <SelectTrigger className="w-20"><SelectValue placeholder="시" /></SelectTrigger>
            <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{h}시</SelectItem>)}</SelectContent>
          </Select>
          <Select value={workHoursEnd.split(":")[1] ?? ""} onValueChange={(m) => setWorkHoursEnd(`${workHoursEnd.split(":")[0] ?? "00"}:${m}`)}>
            <SelectTrigger className="w-20"><SelectValue placeholder="분" /></SelectTrigger>
            <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={m}>{m}분</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mainTask">주요 업무 *</Label>
        <Textarea id="mainTask" placeholder="주요 업무를 입력하세요" value={mainTask} onChange={(e) => setMainTask(e.target.value)} rows={4} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred">우대 사항</Label>
        <Textarea id="preferred" placeholder="우대 사항을 입력하세요" value={preferred} onChange={(e) => setPreferred(e.target.value)} rows={3} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handleBack} className="flex-1">취소</Button>
        <Button type="button" variant="teal" onClick={handleNextStep} className="flex-1">다음 단계</Button>
      </div>
    </div>
  );
}
