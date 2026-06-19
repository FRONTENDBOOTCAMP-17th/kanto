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
      { key: "chinese", label: "중국어" },
      { key: "japanese", label: "일본어" },
      { key: "interpretation", label: "통역 가능" },
    ],
  },
  {
    group: "체류",
    items: [
      { key: "local_resident", label: "현지 거주" },
      { key: "nine_g_visa", label: "9G비자" },
      { key: "ph_permanent_resident", label: "필리핀 영주권" },
      { key: "spouse_visa", label: "배우자 비자" },
      { key: "immediate_start", label: "즉시 출근" },
      { key: "long_term", label: "장기 근무" },
    ],
  },
  {
    group: "경력",
    items: [
      { key: "entry_level", label: "신입/경력무관" },
      { key: "one_to_three", label: "1~3년" },
      { key: "three_to_five", label: "3~5년" },
      { key: "five_plus", label: "5년 이상" },
    ],
  },
  {
    group: "직군",
    items: [
      { key: "office_admin", label: "사무/총무" },
      { key: "sales_marketing", label: "영업/마케팅" },
      { key: "it_dev", label: "IT/개발" },
      { key: "design", label: "디자인" },
      { key: "translation", label: "통번역" },
      { key: "customer_service_cs", label: "고객서비스/CS" },
      { key: "casino_gaming", label: "카지노/게이밍" },
      { key: "logistics_trade", label: "물류/무역" },
      { key: "food_service", label: "요식업/서비스직" },
      { key: "job_other", label: "기타" },
    ],
  },
  {
    group: "기타",
    items: [
      { key: "drivers_license", label: "운전면허" },
      { key: "remote_hybrid", label: "재택/하이브리드 가능" },
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
  | "manager_phone" | "manager_email" | "images" | "company_logo"
> & { title: string };
