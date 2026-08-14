"use client";

import { useEffect, useRef, useState } from "react";
import type { Team } from "../actions";

export function useTeamSearch(teams: Team[]) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = teams.filter((t) => t.name.includes(query));

  return { query, setQuery, filtered, inputRef };
}
