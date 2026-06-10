import type { JobDetail } from "@/type/job/jobsDetail";

export default function JobContent({ job }: { job: JobDetail }) {
  return (
    <div className="p-6 space-y-6">
      <h2 className="font-semibold text-base">상세 내용</h2>
      <div className="space-y-2">
        <h3 className="font-medium text-gray-700">주요 업무</h3>
        <p className="text-sm text-gray-600 whitespace-pre-line">{job.main_task}</p>
      </div>
      {job.preferred && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">우대 사항</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{job.preferred}</p>
        </div>
      )}
    </div>
  );
}
