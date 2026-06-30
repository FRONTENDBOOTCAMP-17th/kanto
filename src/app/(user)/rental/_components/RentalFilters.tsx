"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { RENTAL_ROOM_TYPES } from "@/type/rental/rentalList";
import { useUrlParams } from "@/hooks/useUrlParams";

interface Props {
  givenSearch: string;
  defaultRoomType: string;
  defaultLocation: string;
}

export function RentalFilters({
  givenSearch,
  defaultRoomType,
  defaultLocation,
}: Props) {
  const t = useTranslations("Rental");
  const te = useTranslations("Enums");
  const { updateParams } = useUrlParams();
  const [pendingRoomType, setPendingRoomType] = useState(defaultRoomType);

  const roomTypeOptions = RENTAL_ROOM_TYPES.map((r) => ({
    id: r.id,
    label: te(`rentalRoomType.${r.id}`),
  }));

  return (
    <SearchBar
      givenSearch={givenSearch}
      defaultLocation={defaultLocation}
      onSearch={(query, location) =>
        updateParams({
          search: query,
          location,
          barangay: "all",
          roomType: pendingRoomType,
        })
      }
      showLocation
    >
      <FilterDropdown
        options={roomTypeOptions}
        value={pendingRoomType}
        onChange={setPendingRoomType}
        label={t("selectRoomType")}
      />
    </SearchBar>
  );
}
