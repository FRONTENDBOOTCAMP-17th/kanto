import { useState } from "react";

export function useSearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  const handleSearch = (query: string, location: string) => {
    setSearchQuery(query);
    setLocationFilter(location);
  };

  return { searchQuery, locationFilter, handleSearch };
}
