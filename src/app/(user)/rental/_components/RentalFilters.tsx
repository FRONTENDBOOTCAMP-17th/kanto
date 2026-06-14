"use client";

import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { RENTAL_ROOM_TYPES } from "@/type/rental/rentalList";
import { useUrlParams } from "@/hooks/useUrlParams";

interface Props {
  givenSearch: string;
  defaultRoomType: string;
  defaultLocation: string;
}

export function RentalFilters({ givenSearch, defaultRoomType, defaultLocation }: Props) {
  const { updateParams } = useUrlParams();

  return (
    <SearchBar
      givenSearch={givenSearch}
      defaultLocation={defaultLocation}
      onSearch={(query, location) => updateParams({ search: query, location })}
      showLocation
    >
      <FilterDropdown
        options={RENTAL_ROOM_TYPES}
        value={defaultRoomType}
        onChange={(v) => updateParams({ roomType: v })}
      />
    </SearchBar>
  );
}
