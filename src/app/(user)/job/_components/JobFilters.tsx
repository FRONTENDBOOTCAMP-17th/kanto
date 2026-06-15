"use client";

import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { EMPLOYEE_TYPES } from "@/type/job/jobCreate";
import { useUrlParams } from "@/hooks/useUrlParams";

interface Props {
  givenSearch: string;
  defaultType: string;
  defaultLocation: string;
}

export function JobFilters({ givenSearch, defaultType, defaultLocation }: Props) {
  const { updateParams } = useUrlParams();

  return (
    <SearchBar
      givenSearch={givenSearch}
      defaultLocation={defaultLocation}
      onSearch={(query, location) => updateParams({ search: query, location })}
      showLocation
    >
      <FilterDropdown
        options={[{ id: "all", label: "전체" }, ...EMPLOYEE_TYPES]}
        value={defaultType}
        onChange={(v) => updateParams({ type: v })}
      />
    </SearchBar>
  );
}
