import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Briefcase } from "lucide-react";
import { getJobList } from "@/services/job/job";

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
import { ListPageHero } from "@/components/common/ListPageHero";
import { FilterBar } from "@/components/common/FilterBar";
import { SortSelect } from "@/components/common/SortSelect";
import { ListSearchBar } from "@/components/common/ListSearchBar";
import { JobList } from "./_components/JobList";
import { PaginationUrl } from "@/components/common/PaginationUrl";
import { EMPLOYEE_TYPES, SALARY_TYPES } from "@/type/job/jobCreate";
import { TRADE_LOCATIONS } from "@/type/location";

const ITEMS_PER_PAGE = 10;

interface SearchParams {
  search?: string;
  type?: string;
  salaryType?: string;
  location?: string;
  page?: string;
  sort?: string;
}

export default async function JobPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? 1);
  const t = await getTranslations("Job");
  const te = await getTranslations("Enums");
  const tc = await getTranslations("Common");

  const [{ posts, total }, { likedIds, currentUserId }, sessionUser, isVerified] =
    await Promise.all([
      getJobList(
        {
          search: params.search,
          employeeType: params.type,
          salaryType: params.salaryType,
          location: params.location,
          sort: params.sort ?? "latest",
        },
        { page: currentPage, pageSize: ITEMS_PER_PAGE },
      ),
      getLikeList("jobs"),
      getSessionUser(),
      getIdentityVerified(),
    ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const sections = [
    {
      key: "location",
      label: tc("filter.location"),
      options: TRADE_LOCATIONS.map((id) => ({
        id,
        label: id === "그 외 지역" ? te("tradeLocation.otherAreas") : id,
      })),
    },
    {
      key: "type",
      label: tc("filter.employeeType"),
      options: EMPLOYEE_TYPES.map((type) => ({
        id: type.id,
        label: te(`employeeType.${type.id}`),
      })),
    },
    {
      key: "salaryType",
      label: tc("filter.salaryType"),
      options: SALARY_TYPES.map((s) => ({ id: s, label: te(`salaryType.${s}`) })),
    },
  ];

  const values = {
    location: params.location ?? "all",
    type: params.type ?? "all",
    salaryType: params.salaryType ?? "all",
  };

  const sortOptions = [
    { id: "popular", label: tc("sortPopular") },
    { id: "latest", label: tc("sortLatest") },
    { id: "deadline", label: tc("sortDeadline") },
  ];

  return (
    <div className="page-wrapper">
      <main className="flex-1 page-container w-full py-8">
        <ListPageHero
          icon={Briefcase}
          title={t("title")}
          subtitle={
            params.search ? t("searchResult", { query: params.search }) : t("subtitle")
          }
          action={
            <CategoryWriteButton
              href="/job/create"
              label={t("write")}
              isLoggedIn={!!sessionUser}
              initialIsVerified={isVerified}
            />
          }
        >
          <ListSearchBar givenSearch={params.search ?? ""} />
        </ListPageHero>

        <div className="flex items-center justify-between gap-3 my-6">
          <FilterBar sections={sections} values={values} />
          <SortSelect
            options={sortOptions}
            value={params.sort ?? "latest"}
            label={tc("sortLabel")}
          />
        </div>

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
