"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
    });
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return { updateParams, searchParams };
}
