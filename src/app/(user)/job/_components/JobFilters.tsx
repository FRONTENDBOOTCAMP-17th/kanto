"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("Job");
  const te = useTranslations("Enums");
  const { updateParams } = useUrlParams();

  const typeOptions = [
    { id: "all", label: t("allTypes") },
    ...EMPLOYEE_TYPES.map((type) => ({
      id: type.id,
      label: te(`employeeType.${type.id}`),
    })),
  ];

  return (
    <SearchBar
      givenSearch={givenSearch}
      defaultLocation={defaultLocation}
      onSearch={(query, location) => updateParams({ search: query, location })}
      showLocation
    >
      <FilterDropdown
        options={typeOptions}
        value={defaultType}
        onChange={(v) => updateParams({ type: v })}
      />
    </SearchBar>
  );
}
