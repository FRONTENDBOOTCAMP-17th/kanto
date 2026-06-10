export const EMPLOYEE_TYPES = [
  { id: "정규직", label: "정규직" },
  { id: "계약직", label: "계약직" },
  { id: "파트타임", label: "파트타임" },
] as const;
export const SALARY_TYPES = ["시급", "주급", "월급"] as const;

export type EmployeeType = (typeof EMPLOYEE_TYPES)[number]["id"];
export type SalaryType = (typeof SALARY_TYPES)[number];
