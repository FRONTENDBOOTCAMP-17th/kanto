import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ShoppingBag } from "lucide-react";

import {
  getUsedGoodsList,
  getUsedGoodsBarangays,
} from "@/services/usedGoods/usedGoods";

export const metadata: Metadata = {
  title: "중고거래",
  description: "필리핀 한인 중고거래 매물을 찾아보세요.",
  openGraph: {
    title: "중고거래 | 칸토",
    description: "필리핀 한인 중고거래 매물을 찾아보세요.",
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
import { UsedGoodsList } from "@/app/(user)/usedgoods/_components/UsedGoodsList";
import { PaginationUrl } from "@/components/common/PaginationUrl";
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from "@/type/usedGoods";
import { TRADE_LOCATIONS } from "@/type/location";

const ITEMS_PER_PAGE = 12;

interface SearchParams {
  search?: string;
  category?: string;
  condition?: string;
  location?: string;
  barangay?: string;
  page?: string;
  sort?: string;
}

export default async function UsedGoodsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? 1);
  const t = await getTranslations("UsedGoods");
  const te = await getTranslations("Enums");
  const tc = await getTranslations("Common");

  const [
    { posts, total },
    { likedIds, currentUserId },
    sessionUser,
    isVerified,
    barangayMap,
  ] = await Promise.all([
    getUsedGoodsList(
      {
        search: params.search,
        category: params.category,
        condition: params.condition,
        location: params.location,
        barangay: params.barangay,
        sort: params.sort ?? "latest",
      },
      { page: currentPage, pageSize: ITEMS_PER_PAGE },
    ),
    getLikeList("used_goods"),
    getSessionUser(),
    getIdentityVerified(),
    getUsedGoodsBarangays(),
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
      key: "category",
      label: tc("filter.category"),
      options: PRODUCT_CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
        id: c.id,
        label: te(`productCategory.${c.id}`),
      })),
    },
    {
      key: "condition",
      label: tc("filter.condition"),
      options: PRODUCT_CONDITIONS.map((c) => ({
        id: c.id,
        label: te(`productCondition.${c.id}`),
      })),
    },
  ];

  const values = {
    location: params.location ?? "all",
    barangay: params.barangay ?? "all",
    category: params.category ?? "all",
    condition: params.condition ?? "all",
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
          icon={ShoppingBag}
          title={t("title")}
          subtitle={
            params.search ? t("searchResult", { query: params.search }) : t("subtitle")
          }
          action={
            <CategoryWriteButton
              href="/usedgoods/create"
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

        <UsedGoodsList
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
