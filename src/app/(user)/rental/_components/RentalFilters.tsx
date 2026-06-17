"use client";

import { useState } from "react";
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
  const [pendingRoomType, setPendingRoomType] = useState(defaultRoomType);

  return (
    <SearchBar
      givenSearch={givenSearch}
      defaultLocation={defaultLocation}
      onSearch={(query, location) =>
        updateParams({ search: query, location, roomType: pendingRoomType })
      }
      showLocation
    >
      <FilterDropdown
        options={RENTAL_ROOM_TYPES}
        value={pendingRoomType}
        onChange={setPendingRoomType}
        label="방 종류 선택"
      />
    </SearchBar>
  );
}
