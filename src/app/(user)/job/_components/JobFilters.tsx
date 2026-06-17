"use client";

import { useState } from "react";
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
  const [pendingType, setPendingType] = useState(defaultType);

  return (
    <SearchBar
      givenSearch={givenSearch}
      defaultLocation={defaultLocation}
      onSearch={(query, location) =>
        updateParams({ search: query, location, type: pendingType })
      }
      showLocation
    >
      <FilterDropdown
        options={[{ id: "all", label: "전체" }, ...EMPLOYEE_TYPES]}
        value={pendingType}
        onChange={setPendingType}
        label="고용 형태 선택"
      />
    </SearchBar>
  );
}
