"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { PRODUCT_CATEGORIES } from "@/type/usedGoods";
import { useUrlParams } from "@/hooks/useUrlParams";

interface Props {
  givenSearch: string;
  defaultCategory: string;
  defaultLocation: string;
}

export function UsedGoodsFilters({
  givenSearch,
  defaultCategory,
  defaultLocation,
}: Props) {
  const t = useTranslations("UsedGoods");
  const te = useTranslations("Enums");
  const { updateParams } = useUrlParams();
  const [pendingCategory, setPendingCategory] = useState(defaultCategory);

  const categoryOptions = PRODUCT_CATEGORIES.map((c) => ({
    id: c.id,
    label: te(`productCategory.${c.id}`),
  }));

  return (
    <SearchBar
      givenSearch={givenSearch}
      defaultLocation={defaultLocation}
      onSearch={(query, location) =>
        updateParams({
          search: query,
          location,
          barangay: "all",
          category: pendingCategory,
        })
      }
      showLocation
    >
      <FilterDropdown
        options={categoryOptions}
        value={pendingCategory}
        onChange={setPendingCategory}
        label={t("selectCategory")}
      />
    </SearchBar>
  );
}
