import { notFound } from "next/navigation";
import { after } from "next/server";
import { getTranslations } from "next-intl/server";
import { getJobDetail } from "@/services/job/jobDetail";
import { getUserLikeReportStatus } from "@/services/getUserLikeReportStatus";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarresel";
import JobTitle from "./_components/JobTitle";
import JobInfo from "./_components/JobInfo";
import JobAuthorInfo from "./_components/JobAuthorInfo";
import JobContent from "./_components/JobContent";
import CompanyInfo from "./_components/CompanyInfo";
import { viewCountUp } from "@/services/view";
import { createClient } from "@/utils/supabase/server";
import RelatedItemsCarousel, { type RelatedItem } from "@/components/common/RelatedItemsCarousel";

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
    notFound();
  }

  const images = (job.images as string[]) ?? [];
  // 조회수 증가는 응답 후로 미뤄 렌더를 막지 않는다.
  after(() => viewCountUp(job.post_id));
  // 서로 독립인 like/report 조회와 번역 로딩을 병렬로.
  const [{ userId, initialLiked, initialReported }, t] = await Promise.all([
    getUserLikeReportStatus(job.post_id),
    getTranslations("Job"),
  ]);

  const supabase = await createClient();
  const { data: relatedData } = await supabase
    .from("jobs")
    .select("id, post_id, images, salary, posts(title)")
    .eq("location_type", job.location_type)
    .neq("id", job.id)
    .limit(8);
  const relatedItems: RelatedItem[] = (relatedData ?? []).map((item) => ({
    id: item.id,
    href: `/job/${item.post_id}`,
    imageSrc: ((item.images as string[]) ?? [])[0] ?? null,
    title: (item.posts as { title: string | null } | null)?.title ?? "",
    priceText: `₱ ${item.salary.toLocaleString()}`,
  }));

  return (
    <div className="page-container w-full py-6">
      <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-200">
        <JobTitle job={job} userId={userId} initialLiked={initialLiked} initialReported={initialReported} />
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <JobInfo job={job} />
          <JobAuthorInfo job={job} userId={userId} />
        </div>
        {images.length > 0 && (
          <div className="p-6 space-y-2">
            <h2 className="font-semibold text-base md:text-lg">{t("photos")}</h2>
            <div className="aspect-4/3 w-full md:w-1/2 mx-auto">
              <ImageCarousel images={images} />
            </div>
          </div>
        )}
        <JobContent job={job} />
        <CompanyInfo job={job} />
      </div>
      <RelatedItemsCarousel title="관련 공고" items={relatedItems} />
    </div>
  );
}
