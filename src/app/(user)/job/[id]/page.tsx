import { getTranslations } from "next-intl/server";
import { getJobDetail } from "@/services/job/jobDetail";
import { getUserLikeReportStatus } from "@/services/getUserLikeReportStatus";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarresel";
import JobTitle from "./_components/JobTitle";
import JobInfo from "./_components/JobInfo";
import JobAuthorInfo from "./_components/JobAuthorInfo";
import JobContent from "./_components/JobContent";
import CompanyInfo from "./_components/CompanyInfo";
import VerifyAuthor from "@/components/common/VerifyAuthor";
import { viewCountUp } from "@/services/view";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let job;
  try {
    job = await getJobDetail(Number(id));
  } catch {
    const t = await getTranslations("Common");
    return (
      <div className="p-8 text-center text-gray-500">
        {t("notFound")}
      </div>
    );
  }

  const images = (job.images as string[]) ?? [];
  await viewCountUp(job.post_id);
  const { userId, initialLiked, initialReported } = await getUserLikeReportStatus(job.post_id);
  const t = await getTranslations("Job");

  return (
    <div className="page-container w-full py-6">
      <div className="flex justify-end mb-4">
        <VerifyAuthor
          authorAuthId={job.posts.users?.auth_id}
          editPath={`/job/${id}/edit`}
          postId={job.post_id}
          redirectPath="/job"
        />
      </div>
      <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-200">
        <JobTitle job={job} userId={userId} initialLiked={initialLiked} initialReported={initialReported} />
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <JobInfo job={job} />
          <JobAuthorInfo job={job} userId={userId} />
        </div>
        {images.length > 0 && (
          <div className="p-6 space-y-2">
            <h2 className="font-semibold text-base">{t("photos")}</h2>
            <div className="aspect-4/3">
              <ImageCarousel images={images} />
            </div>
          </div>
        )}
        <JobContent job={job} />
        <CompanyInfo job={job} />
      </div>
    </div>
  );
}
