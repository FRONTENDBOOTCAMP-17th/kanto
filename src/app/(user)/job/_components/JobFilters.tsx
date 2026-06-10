"use client";

import { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { EMPLOYEE_TYPES } from "@/type/job";
import { useUrlParams } from "@/hooks/useUrlParams";

export function JobFilters() {
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
        options={[{ id: "all", label: "전체" }, ...EMPLOYEE_TYPES]}
        value={searchParams.get("type") ?? "all"}
        onChange={(v) => updateParams({ type: v })}
      />
    </SearchBar>
  );
}
