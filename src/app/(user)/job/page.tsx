import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getJobList, getPopularJobs } from "@/services/job/job";

export const metadata: Metadata = {
  title: "구인구직",
  description: "필리핀 한인 구인구직 공고를 찾아보세요.",
  openGraph: {
    title: "구인구직 | 칸토",
    description: "필리핀 한인 구인구직 공고를 찾아보세요.",
    images: [{ url: "/kantoLogo.png", alt: "칸토 로고" }],
  },
};
import { getLikeList } from "@/services/likes";
import { getSessionUser, getIdentityVerified } from "@/services/user/user";
import { CategoryWriteButton } from "@/components/common/CategoryWriteButton";
import { JobFilters } from "./_components/JobFilters";
import { JobList } from "./_components/JobList";
import { PopularJobs } from "./_components/PopularJobs";
import { PaginationUrl } from "@/components/common/PaginationUrl";

const ITEMS_PER_PAGE = 10;

export default async function JobPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; location?: string; page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? 1);
  const t = await getTranslations("Job");

  const [{ posts, total }, { likedIds, currentUserId }, popularPosts, sessionUser, isVerified] =
    await Promise.all([
      getJobList(
        {
          search: params.search,
          employeeType: params.type,
          location: params.location,
        },
        { page: currentPage, pageSize: ITEMS_PER_PAGE },
      ),
      getLikeList("jobs"),
      getPopularJobs(),
      getSessionUser(),
      getIdentityVerified(),
    ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="page-wrapper">
      <main className="flex-1 page-container w-full py-8">
        <div className="relative flex flex-col items-center text-center mb-6">
          <h1 className="page-title-lg">{t("title")}</h1>
          <p className="text-gray-600 mt-1">
            {params.search
              ? t("searchResult", { query: params.search })
              : t("subtitle")}
          </p>
          <div className="absolute right-0 top-0">
            <CategoryWriteButton
              href="/job/create"
              label={t("write")}
              isLoggedIn={!!sessionUser}
              initialIsVerified={isVerified}
            />
          </div>
        </div>

        <JobFilters
          givenSearch={params.search ?? ""}
          defaultType={params.type ?? "all"}
          defaultLocation={params.location ?? sessionUser?.region ?? "all"}
        />

        <div className="border-t border-gray-200 my-6" />

        <PopularJobs posts={popularPosts} likedIds={likedIds} currentUserId={currentUserId} />

        <JobList
          posts={posts}
          likedIds={likedIds}
          currentUserId={currentUserId}
          currentPage={currentPage}
          emptyMessage={params.search ? t("emptySearch") : t("empty")}
        />

        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <PaginationUrl currentPage={currentPage} totalPage={totalPages} />
          </div>
        )}
      </main>
    </div>
  );
}
