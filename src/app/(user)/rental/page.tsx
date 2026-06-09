import { Suspense } from "react";

import { getRentalList } from "@/services/rental/rental";
import { getLikeList } from "@/services/likes";
import { RentalList } from "./_components/RentalList";

export default async function RentalPage() {
  const [posts, likedIds] = await Promise.all([
    getRentalList(),
    getLikeList("rental"),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="flex-1" />}>
        <RentalList initialPosts={posts} initialLikedIds={likedIds} />
      </Suspense>
    </div>
  );
}
