export interface Company {
  id: number;
  user_id: number;
  company_name: string;
  company_intro: string;
  company_logo: string | null;
  company_address: string | null;
  company_website: string | null;
  company_year: number | null;
  employee_count: number | null;
  industry: string | null;
  company_type: string | null;
  created_at: string;
  updated_at: string;
}
