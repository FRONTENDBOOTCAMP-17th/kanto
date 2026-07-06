"use client";
import { createContext, useContext, type RefObject } from "react";

export const ScrollContext = createContext<RefObject<HTMLDivElement | null>>({ current: null });

export function useScrollContainer() {
  return useContext(ScrollContext);
}
