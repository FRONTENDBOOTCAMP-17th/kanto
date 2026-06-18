import type { Tables } from "@/type/supabase";

export const EMPLOYEE_TYPES = [
  { id: "정규직", label: "정규직" },
  { id: "계약직", label: "계약직" },
  { id: "파트타임", label: "파트타임" },
] as const;
export const SALARY_TYPES = ["시급", "주급", "월급"] as const;

export type EmployeeType = (typeof EMPLOYEE_TYPES)[number]["id"];
export type SalaryType = (typeof SALARY_TYPES)[number];

// 근무 요일 (월~일) + 빠른 선택 프리셋
export const WORK_DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
export const DAY_PRESETS = [
  { id: "평일", days: ["월", "화", "수", "목", "금"] },
  { id: "주말", days: ["토", "일"] },
  { id: "매일", days: ["월", "화", "수", "목", "금", "토", "일"] },
] as const;

// 우대 사항 카테고리 (key는 DB 저장값, label은 표시용)
export const PREFERRED_CATEGORIES = [
  {
    group: "어학",
    items: [
      { key: "korean", label: "한국어" },
      { key: "english", label: "영어" },
      { key: "tagalog", label: "따갈로그어" },
      { key: "interpretation", label: "통역 가능" },
    ],
  },
  {
    group: "체류",
    items: [
      { key: "local_resident", label: "현지 거주" },
      { key: "work_visa", label: "취업비자" },
      { key: "immediate_start", label: "즉시 출근" },
      { key: "long_term", label: "장기 근무" },
    ],
  },
  {
    group: "경력",
    items: [
      { key: "same_industry", label: "동종업계" },
      { key: "job_experience", label: "직무 경험" },
      { key: "beginner_ok", label: "초보 가능" },
      { key: "korean_company_exp", label: "한국기업 경험" },
    ],
  },
  {
    group: "자격",
    items: [
      { key: "drivers_license", label: "운전면허" },
      { key: "certificate", label: "자격증 보유" },
      { key: "computer_skill", label: "컴퓨터 활용" },
    ],
  },
  {
    group: "직군",
    items: [
      { key: "driving", label: "운전" },
      { key: "cooking", label: "조리" },
      { key: "teaching", label: "교육" },
      { key: "customer_service", label: "고객 응대" },
    ],
  },
  {
    group: "기타",
    items: [
      { key: "local_family", label: "현지 가족" },
      { key: "referral", label: "지인 추천" },
    ],
  },
] as const;

// key → label 매핑 (표시용)
export const PREFERRED_LABELS: Record<string, string> = Object.fromEntries(
  PREFERRED_CATEGORIES.flatMap((c) => c.items.map((i) => [i.key, i.label])),
);

export type JobInitialData = Pick<
  Tables<"jobs">,
  | "post_id" | "employee_type" | "salary" | "salary_type"
  | "location_type" | "location_custom" | "deadline" | "work_hours"
  | "work_days" | "is_time_negotiable"
  | "main_task" | "preferred" | "preferred_tags" | "company_name" | "company_intro"
  | "industry" | "company_year" | "employee_count" | "company_address"
  | "company_website" | "manager_title"
  | "manager_phone" | "manager_email" | "images"
> & { title: string };
