"use client";

import { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { PRODUCT_CATEGORIES } from "@/type/usedGoods";
import { useUrlParams } from "@/hooks/useUrlParams";

export function UsedGoodsFilters() {
  const { updateParams, searchParams } = useUrlParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  return (
    <SearchBar
      searchInput={searchInput}
      onSearchChange={setSearchInput}
      onSearchSubmit={(e) => { e.preventDefault(); updateParams({ search: searchInput }); }}
      locationFilter={searchParams.get("location") ?? "all"}
      onLocationChange={(v) => updateParams({ location: v })}
    >
      <FilterDropdown
        options={PRODUCT_CATEGORIES}
        value={searchParams.get("category") ?? "all"}
        onChange={(v) => updateParams({ category: v })}
      />
    </SearchBar>
  );
}
