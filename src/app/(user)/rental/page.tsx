import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getRentalList } from "@/services/rental/rental";

export const metadata: Metadata = {
  title: "부동산",
  description: "필리핀 한인 렌탈 매물을 찾아보세요.",
  openGraph: {
    title: "부동산 | 칸토",
    description: "필리핀 한인 렌탈 매물을 찾아보세요.",
    images: [{ url: "/kantoLogo.png", alt: "칸토 로고" }],
  },
};
import { getLikeList } from "@/services/likes";
import { getSessionUser, getIdentityVerified } from "@/services/user/user";
import { RentalList } from "./_components/RentalList";
import { RentalFilters } from "./_components/RentalFilters";
import { PaginationUrl } from "@/components/common/PaginationUrl";
import { CategoryWriteButton } from "@/components/common/CategoryWriteButton";

const ITEMS_PER_PAGE = 12;

interface SearchParams {
  search?: string;
  roomType?: string;
  location?: string;
  barangay?: string;
  page?: string;
}

export default async function RentalPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? 1);
  const t = await getTranslations("Rental");

  const [{ posts, total }, { likedIds, currentUserId }, sessionUser, isVerified] =
    await Promise.all([
      getRentalList(
        {
          search: params.search,
          roomType: params.roomType,
          location: params.location,
          barangay: params.barangay,
        },
        { page: currentPage, pageSize: ITEMS_PER_PAGE },
      ),
      getLikeList("rental"),
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
              href="/rental/create"
              label={t("write")}
              isLoggedIn={!!sessionUser}
              initialIsVerified={isVerified}
            />
          </div>
        </div>

        <RentalFilters
          givenSearch={params.search ?? ""}
          defaultRoomType={params.roomType ?? "all"}
          defaultLocation={params.location ?? sessionUser?.region ?? "all"}
        />

        <div className="border-t border-gray-200 my-6" />

        <RentalList
          initialPosts={posts}
          initialLikedIds={likedIds}
          currentUserId={currentUserId}
          currentPage={currentPage}
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
