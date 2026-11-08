import { notFound } from "next/navigation";
import { formatPrice, getDeadlineDiff } from "@/utils/format";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicJobDetail } from "@/services/job/jobDetail";
import ImageCarousel from "@/app/[locale]/(user)/rental/[id]/_components/ImageCarresel";
import BackButton from "./_components/BackButton";
import VerifyAuthor from "@/components/common/VerifyAuthor";
import JobTitle from "./_components/JobTitle";
import JobInfo from "./_components/JobInfo";
import JobAuthorInfo from "./_components/JobAuthorInfo";
import JobContent from "./_components/JobContent";
import CompanyInfo from "./_components/CompanyInfo";
import { ViewCounter } from "@/components/common/ViewCounter";
import { createPublicClient } from "@/utils/supabase/public";
import RelatedItemsCarousel, { type RelatedItem } from "@/components/common/RelatedItemsCarousel";
import { resolvePostId, encryptPostId } from "@/utils/postIdCipher";
import { encryptUserId } from "@/utils/userIdCipher";
export { generateMetadata } from "./metadata";

// 상세 페이지는 로그인 사용자와 무관한 공개 데이터만 서버에서 렌더링하고 ISR로 캐시한다.
// 좋아요·신고 여부, 작성자 여부, 조회수 증가는 클라이언트에서 처리한다.
export const revalidate = 300;

// 빌드 시 미리 만들지 않고 첫 방문 때 생성해 캐시한다.
export function generateStaticParams() {
  return [];
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const postId = resolvePostId(id);
  if (postId === null) notFound();

  let rawJob;
  try {
    rawJob = await getPublicJobDetail(postId);
  } catch {
    notFound();
  }

  const job = {
    ...rawJob,
    id_token: encryptPostId(rawJob.post_id),
    posts: {
      ...rawJob.posts,
      users: rawJob.posts.users
        ? { ...rawJob.posts.users, id_token: encryptUserId(rawJob.posts.users.id) }
        : rawJob.posts.users,
    },
  };

  const images = (job.images as string[]) ?? [];

  const fetchRelated = async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("jobs")
      .select("id, post_id, images, salary, deadline, posts!inner(title)")
      .eq("location_type", job.location_type)
      .eq("posts.status", "active")
      .neq("id", job.id)
      .limit(8);
    return data;
  };

  const [t, tCommon, relatedData] = await Promise.all([
    getTranslations("Job"),
    getTranslations("Common"),
    fetchRelated(),
  ]);

  const relatedItems: RelatedItem[] = (relatedData ?? []).map((item) => ({
    id: item.id,
    href: `/job/${encryptPostId(item.post_id)}`,
    imageSrc: ((item.images as string[]) ?? [])[0] ?? null,
    title: (item.posts as { title: string | null } | null)?.title ?? "",
    priceText: formatPrice(item.salary),
    overlayLabel: getDeadlineDiff(item.deadline) < 0 ? tCommon("dealClosed") : undefined,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.posts.title,
    description: job.main_task?.slice(0, 160),
    datePosted: job.created_at,
    validThrough: job.deadline,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company_name,
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressCountry: "PH" },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "PHP",
      value: job.salary,
    },
  };

  return (
    <div className="page-container pb-28 md:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewCounter postId={job.post_id} />
      <div className="flex items-center justify-between mt-4">
        <BackButton />
        <VerifyAuthor
          authorAuthId={job.posts.users?.auth_id}
          editPath={`/job/${job.id_token}/edit`}
          postId={job.post_id}
          redirectPath="/job"
        />
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-4">
          <ImageCarousel images={images} />
          <div className="flex flex-col gap-6 pt-4 md:pt-0">
            <JobTitle job={job} />
            <hr className="border-gray-200" />
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="flex-1 flex flex-col gap-4">
                <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-600">{t("jobInfo")}</h2>
                <JobInfo job={job} />
              </div>
              <JobAuthorInfo job={job} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <JobTitle job={job} />
          <hr className="border-gray-200 my-8" />
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-600">{t("jobInfo")}</h2>
              <JobInfo job={job} />
            </div>
            <JobAuthorInfo job={job} />
          </div>
        </div>
      )}

      <hr className="border-gray-200 my-8" />

      <JobContent job={job} />

      <hr className="border-gray-200 my-8" />

      <CompanyInfo job={job} />

      <RelatedItemsCarousel title="관련 공고" items={relatedItems} />
    </div>
  );
}
