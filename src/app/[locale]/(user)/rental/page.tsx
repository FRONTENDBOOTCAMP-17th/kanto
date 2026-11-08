import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Home } from "lucide-react";

import { getRentalList, getRentalBarangays } from "@/services/rental/rental";

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
import { PaginationUrl } from "@/components/common/PaginationUrl";
import { CategoryWriteButton } from "@/components/common/CategoryWriteButton";
import { ListPageHero } from "@/components/common/ListPageHero";
import { FilterBar } from "@/components/common/FilterBar";
import { SortSelect } from "@/components/common/SortSelect";
import { ListSearchBar } from "@/components/common/ListSearchBar";
import { RENTAL_ROOM_TYPES, RENTAL_RENT_TYPES } from "@/type/rental/rentalList";
import { TRADE_LOCATIONS } from "@/type/location";

const ITEMS_PER_PAGE = 12;

interface SearchParams {
  search?: string;
  roomType?: string;
  rentType?: string;
  location?: string;
  barangay?: string;
  page?: string;
  sort?: string;
}

export default async function RentalPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? 1);
  const t = await getTranslations("Rental");
  const te = await getTranslations("Enums");
  const tc = await getTranslations("Common");

  const [
    { posts, total },
    { likedIds, currentUserId },
    sessionUser,
    isVerified,
    barangayMap,
  ] = await Promise.all([
    getRentalList(
      {
        search: params.search,
        roomType: params.roomType,
        rentType: params.rentType,
        location: params.location,
        barangay: params.barangay,
        sort: params.sort ?? "latest",
      },
      { page: currentPage, pageSize: ITEMS_PER_PAGE },
    ),
    getLikeList("rental"),
    getSessionUser(),
    getIdentityVerified(),
    getRentalBarangays(),
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
      key: "barangay",
      label: tc("filter.barangay"),
      options: [],
      dependsOn: "location",
    },
    {
      key: "roomType",
      label: tc("filter.roomType"),
      options: RENTAL_ROOM_TYPES.filter((r) => r.id !== "all").map((r) => ({
        id: r.id,
        label: te(`roomType.${r.id}`),
      })),
    },
    {
      key: "rentType",
      label: tc("filter.rentType"),
      options: RENTAL_RENT_TYPES.filter((r) => r.id !== "all").map((r) => ({
        id: r.id,
        label: te(`rentType.${r.id}`),
      })),
    },
  ];

  const values = {
    location: params.location ?? "all",
    barangay: params.barangay ?? "all",
    roomType: params.roomType ?? "all",
    rentType: params.rentType ?? "all",
  };

  const optionsMaps = {
    barangay: Object.fromEntries(
      Object.entries(barangayMap).map(([loc, list]) => [
        loc,
        list.map((b) => ({ id: b, label: b })),
      ]),
    ),
  };

  const sortOptions = [
    { id: "popular", label: tc("sortPopular") },
    { id: "latest", label: tc("sortLatest") },
    { id: "price_asc", label: tc("sortPriceAsc") },
    { id: "price_desc", label: tc("sortPriceDesc") },
  ];

  return (
    <div className="page-wrapper">
      <main className="flex-1 page-container w-full py-8">
        <ListPageHero
          icon={Home}
          title={t("title")}
          subtitle={
            params.search ? t("searchResult", { query: params.search }) : t("subtitle")
          }
          action={
            <CategoryWriteButton
              href="/rental/create"
              label={t("write")}
              isLoggedIn={!!sessionUser}
              initialIsVerified={isVerified}
            />
          }
        >
          <ListSearchBar givenSearch={params.search ?? ""} />
        </ListPageHero>

        <div className="flex items-center justify-between gap-3 my-6">
          <FilterBar
            sections={sections}
            values={values}
            optionsMaps={optionsMaps}
          />
          <SortSelect
            options={sortOptions}
            value={params.sort ?? "latest"}
            label={tc("sortLabel")}
          />
        </div>

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
