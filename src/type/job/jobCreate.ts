import type { Tables } from "@/type/supabase";

export const EMPLOYEE_TYPES = [
  { id: "정규직", label: "정규직" },
  { id: "계약직", label: "계약직" },
  { id: "파트타임", label: "파트타임" },
] as const;
export const SALARY_TYPES = ["시급", "주급", "월급"] as const;

export type EmployeeType = (typeof EMPLOYEE_TYPES)[number]["id"];
export type SalaryType = (typeof SALARY_TYPES)[number];

export type JobInitialData = Pick<
  Tables<"jobs">,
  | "post_id" | "employee_type" | "salary" | "salary_type"
  | "location_type" | "location_custom" | "deadline" | "work_hours"
  | "main_task" | "preferred" | "company_name" | "company_intro"
  | "industry" | "company_year" | "employee_count" | "company_address"
  | "company_website" | "manager_name" | "manager_title"
  | "manager_phone" | "manager_email" | "images"
> & { title: string };
