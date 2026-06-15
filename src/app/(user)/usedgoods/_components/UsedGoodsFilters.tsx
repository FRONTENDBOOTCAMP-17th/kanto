"use client";

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

  return (
    <SearchBar
      givenSearch={givenSearch}
      defaultLocation={defaultLocation}
      onSearch={(query, location) => updateParams({ search: query, location })}
      showLocation
    >
      <FilterDropdown
        options={PRODUCT_CATEGORIES}
        value={defaultCategory}
        onChange={(v) => updateParams({ category: v })}
      />
    </SearchBar>
  );
}
