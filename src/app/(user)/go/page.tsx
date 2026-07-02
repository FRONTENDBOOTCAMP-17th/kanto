"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

function GoMapSkeleton() {
  return (
    <div className="relative h-[calc(100vh-48px)] overflow-hidden md:h-[calc(100vh-109px)] bg-[#e5e3df]">
      <div className="pointer-events-none absolute right-0 top-0 z-10 pt-3.5 left-0">
        <div className="flex items-center gap-2 px-5 pr-18.5 md:pr-47.5">
          <Skeleton className="h-8 w-12 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
      <div className="absolute left-5 top-20 z-10 flex flex-col gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

const GoMapClient = dynamic(() => import("./_components/GoMapClient"), {
  ssr: false,
  loading: () => <GoMapSkeleton />,
});

export default function GoPage() {
  return <GoMapClient />;
}
