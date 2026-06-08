import { Suspense } from "react";

import { getRentalList } from "@/services/rentals";
import { getUserLikedPostIds } from "@/services/likes";
import { RentalList } from "./_components/RentalList";

import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";

export default async function RentalPage() {
  const [posts, likedIds] = await Promise.all([
    getRentalList(),
    getUserLikedPostIds("rental"),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ScrollToTop />
      <Suspense fallback={<div className="flex-1" />}>
        <RentalList initialPosts={posts} initialLikedIds={likedIds} />
      </Suspense>
      <Footer />
    </div>
  );
}
