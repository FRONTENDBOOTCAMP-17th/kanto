import type { Tables } from "@/type/supabase";
import type { Post } from "@/type/post";
import type { SellerInfo } from "@/type/user";
export const EMPLOYEE_TYPES = ["정규직", "계약직", "파트타임"] as const;
export const SALARY_TYPES = ["시급", "주급", "월급"] as const;

export type EmployeeType = (typeof EMPLOYEE_TYPES)[number];
export type SalaryType = (typeof SALARY_TYPES)[number];

export type Job = Tables<"jobs">;

export interface JobWithPost extends Post {
  jobs: Job[];
  users: SellerInfo;
}
