"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ProfileCardSkeleton() {
  return (
    <div className="bg-white md:bg-gray-50 min-h-screen md:min-h-0 md:rounded-xl overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="md:flex md:p-8 p-0 bg-white md:rounded-b-xl">
        <div className="md:w-64 md:shrink-0 flex flex-col gap-6 md:border-r md:border-gray-100 md:px-8 px-5 py-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>

          <div className="border-t border-gray-100" />

          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>

          <div className="border-t border-gray-100" />

          <Skeleton className="h-24 w-full rounded-lg" />
        </div>

        <div className="flex-1 md:pl-8 px-5 py-6 flex flex-col gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
