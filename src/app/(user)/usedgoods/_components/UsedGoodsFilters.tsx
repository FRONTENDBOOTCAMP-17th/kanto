"use client";

import { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { PRODUCT_CATEGORIES } from "@/type/usedGoods";
import { useUrlParams } from "@/hooks/useUrlParams";

interface Props {
  givenSearch: string;
  defaultCategory: string;
  defaultLocation: string;
}

export function UsedGoodsFilters({ givenSearch, defaultCategory, defaultLocation }: Props) {
  const { updateParams } = useUrlParams();
  const [pendingCategory, setPendingCategory] = useState(defaultCategory);

  return (
    <SearchBar
      givenSearch={givenSearch}
      defaultLocation={defaultLocation}
      onSearch={(query, location) =>
        updateParams({ search: query, location, category: pendingCategory })
      }
      showLocation
    >
      <FilterDropdown
        options={PRODUCT_CATEGORIES}
        value={pendingCategory}
        onChange={setPendingCategory}
        label="카테고리 선택"
      />
    </SearchBar>
  );
}
