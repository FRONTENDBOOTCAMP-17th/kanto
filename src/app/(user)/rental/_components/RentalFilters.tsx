"use client";

import { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { RENTAL_ROOM_TYPES } from "@/type/rental/rentalList";
import { useUrlParams } from "@/hooks/useUrlParams";

interface Props {
  defaultSearch: string;
  defaultRoomType: string;
  defaultLocation: string;
}

export function RentalFilters({ defaultSearch, defaultRoomType, defaultLocation }: Props) {
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
        options={RENTAL_ROOM_TYPES}
        value={defaultRoomType}
        onChange={(v) => updateParams({ roomType: v })}
      />
    </SearchBar>
  );
}
