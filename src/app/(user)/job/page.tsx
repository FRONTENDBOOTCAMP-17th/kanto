import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getJobList, getPopularJobs } from "@/services/job/job";
import { getLikeList } from "@/services/likes";
import { getSessionUser } from "@/services/user/user";
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

  const [posts, { likedIds, currentUserId }, popularPosts, sessionUser] = await Promise.all([
    getJobList({
      search: params.search,
      employeeType: params.type,
      location: params.location,
    }),
    getLikeList("jobs"),
    getPopularJobs(),
    getSessionUser(),
  ]);

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const pagedPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

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
          <Link href="/create" className="absolute right-0 top-0">
            <Button variant="teal" className="cursor-pointer gap-1">
              <Plus className="w-4 h-4" />
              {t("write")}
            </Button>
          </Link>
        </div>

        <JobFilters
          givenSearch={params.search ?? ""}
          defaultType={params.type ?? "all"}
          defaultLocation={params.location ?? sessionUser?.region ?? "all"}
        />

        <div className="border-t border-gray-200 my-6" />

        <PopularJobs posts={popularPosts} likedIds={likedIds} currentUserId={currentUserId} />

        <JobList
          posts={pagedPosts}
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
