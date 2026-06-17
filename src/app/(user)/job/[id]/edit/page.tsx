import { getJobDetail } from "@/services/job/jobDetail";
import { CreateJobForm } from "@/app/(user)/job/create/_components/CreateJobForm";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobDetail(Number(id));

  return (
    <div className="page-wrapper">
      <CreateJobForm
        userId={job.posts.users?.id ?? 0}
        initialData={{
          post_id: job.post_id,
          title: job.posts.title,
          employee_type: job.employee_type,
          salary: job.salary,
          salary_type: job.salary_type,
          location_type: job.location_type,
          location_custom: job.location_custom,
          deadline: job.deadline,
          work_hours: job.work_hours,
          main_task: job.main_task,
          preferred: job.preferred,
          company_name: job.company_name,
          company_intro: job.company_intro,
          industry: job.industry,
          company_year: job.company_year,
          employee_count: job.employee_count,
          company_address: job.company_address,
          company_website: job.company_website,
          manager_name: job.manager_name,
          manager_title: job.manager_title,
          manager_phone: job.manager_phone,
          manager_email: job.manager_email,
          images: job.images as string[] | null,
        }}
      />
    </div>
  );
}
