import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getJobList, getPopularJobs } from "@/services/job/job";
import { getLikeList } from "@/services/likes";
import { JobFilters } from "@/app/(user)/job/_components/JobFilters";
import { JobList } from "@/app/(user)/job/_components/JobList";
import { PopularJobs } from "@/app/(user)/job/_components/PopularJobs";
import { PaginationUrl } from "@/components/common/PaginationUrl";

const ITEMS_PER_PAGE = 10;

export default async function JobPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; location?: string; page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? 1);

  const [posts, { likedIds, currentUserId }, popularPosts] = await Promise.all([
    getJobList({
      search: params.search,
      employeeType: params.type,
      location: params.location,
    }),
    getLikeList("jobs"),
    getPopularJobs(),
  ]);

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const pagedPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 page-container w-full py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">구인구직</h1>
          <Link href="/job/create">
            <Button className="cursor-pointer bg-teal-500 hover:bg-teal-600 text-white gap-1">
              <Plus className="w-4 h-4" />
              공고 등록
            </Button>
          </Link>
        </div>

        <JobFilters
          defaultSearch={params.search ?? ""}
          defaultType={params.type ?? "all"}
          defaultLocation={params.location ?? "all"}
        />

        <div className="border-t border-gray-200 my-6" />

        <PopularJobs posts={popularPosts} likedIds={likedIds} currentUserId={currentUserId} />

        <JobList posts={pagedPosts} likedIds={likedIds} currentUserId={currentUserId} />

        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <PaginationUrl currentPage={currentPage} totalPage={totalPages} />
          </div>
        )}
      </main>
    </div>
  );
}
