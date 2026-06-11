"use client";

import { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { RENTAL_ROOM_TYPES } from "@/type/rental";
import { useUrlParams } from "@/hooks/useUrlParams";

export function RentalFilters() {
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
        options={RENTAL_ROOM_TYPES}
        value={searchParams.get("roomType") ?? "all"}
        onChange={(v) => updateParams({ roomType: v })}
      />
    </SearchBar>
  );
}
