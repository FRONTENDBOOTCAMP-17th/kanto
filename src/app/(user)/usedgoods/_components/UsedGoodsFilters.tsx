"use client";

import { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { PRODUCT_CATEGORIES } from "@/type/usedGoods";
import { useUrlParams } from "@/hooks/useUrlParams";

interface Props {
  defaultSearch: string;
  defaultCategory: string;
  defaultLocation: string;
}

export function UsedGoodsFilters({ defaultSearch, defaultCategory, defaultLocation }: Props) {
  const { updateParams } = useUrlParams();
  const [searchInput, setSearchInput] = useState(defaultSearch);

  return (
    <SearchBar
      searchInput={searchInput}
      onSearchChange={setSearchInput}
      onSearchSubmit={(e) => { e.preventDefault(); updateParams({ search: searchInput }); }}
      locationFilter={defaultLocation}
      onLocationChange={(v) => updateParams({ location: v })}
    >
      <FilterDropdown
        options={PRODUCT_CATEGORIES}
        value={defaultCategory}
        onChange={(v) => updateParams({ category: v })}
      />
    </SearchBar>
  );
}
