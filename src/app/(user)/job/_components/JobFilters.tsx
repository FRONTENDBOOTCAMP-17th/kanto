"use client";

import { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { EMPLOYEE_TYPES } from "@/type/job/jobCreate";
import { useUrlParams } from "@/hooks/useUrlParams";

interface Props {
  defaultSearch: string;
  defaultType: string;
  defaultLocation: string;
}

export function JobFilters({ defaultSearch, defaultType, defaultLocation }: Props) {
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
        options={[{ id: "all", label: "전체" }, ...EMPLOYEE_TYPES]}
        value={defaultType}
        onChange={(v) => updateParams({ type: v })}
      />
    </SearchBar>
  );
}
