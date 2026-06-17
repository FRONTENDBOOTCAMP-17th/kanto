import type { JobDetail } from "@/type/job/jobsDetail";
import { PREFERRED_LABELS } from "@/type/job/jobCreate";

export default function JobContent({ job }: { job: JobDetail }) {
  const hasTags = !!job.preferred_tags && job.preferred_tags.length > 0;

  return (
    <div className="p-6 space-y-6">
      <h2 className="font-semibold text-base md:text-lg">상세 내용</h2>
      <div className="space-y-2">
        <h3 className="font-medium text-gray-700 md:text-lg">주요 업무</h3>
        <p className="text-sm md:text-base text-gray-600 whitespace-pre-line">{job.main_task}</p>
      </div>
      {(hasTags || job.preferred) && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700 md:text-lg">우대 사항</h3>
          <div className="flex flex-wrap gap-2">
            {job.preferred_tags?.map((tag) => (
              <span key={tag} className="text-xs md:text-sm bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                {PREFERRED_LABELS[tag] ?? tag}
              </span>
            ))}
            {job.preferred && (
              <span className="text-xs md:text-sm bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                {job.preferred}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
