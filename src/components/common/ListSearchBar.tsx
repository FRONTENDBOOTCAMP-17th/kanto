"use client";

import { SearchBar } from "@/components/common/SearchBar";
import { useUrlParams } from "@/hooks/useUrlParams";

export function ListSearchBar({ givenSearch }: { givenSearch: string }) {
  const { updateParams } = useUrlParams();
  return (
    <SearchBar
      givenSearch={givenSearch}
      onSearch={(query) => updateParams({ search: query })}
      className=""
    />
  );
}
