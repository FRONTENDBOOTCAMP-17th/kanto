"use client";

import { FilterDropdown } from "@/components/common/FilterDropdown";
import { useUrlParams } from "@/hooks/useUrlParams";

interface SortOption {
  id: string;
  label: string;
}

interface SortSelectProps {
  options: readonly SortOption[];
  value: string;
  label: string;
}

export function SortSelect({ options, value, label }: SortSelectProps) {
  const { updateParams } = useUrlParams();

  return (
    <FilterDropdown
      options={options}
      value={value}
      onChange={(id) => updateParams({ sort: id })}
      align="right"
      label={label}
    />
  );
}
