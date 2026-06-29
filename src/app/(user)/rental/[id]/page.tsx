import { notFound } from "next/navigation";
import { formatPrice } from "@/utils/format";
import { after } from "next/server";
import { getRentalDetail } from "@/services/rental/rental";
import { getUserLikeReportStatus } from "@/services/getUserLikeReportStatus";
import BackButton from "@/app/(user)/rental/[id]/_components/BackButton";
import ImageCarousel from "@/app/(user)/rental/[id]/_components/ImageCarresel";
import AccommondationInfo from "./_components/AccommondationInfo";
import RentSellerInfo from "./_components/RentSellerInfo";
import PostInfo from "./_components/PostInfo";
import VerifyAuthor from "@/components/common/VerifyAuthor";
import { viewCountUp } from "@/services/view";
import { createClient } from "@/utils/supabase/server";
import RelatedItemsCarousel, { type RelatedItem } from "@/components/common/RelatedItemsCarousel";
export { generateMetadata } from "./metadata";

export default async function RentalDetail({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  let rental;
  try {
    rental = await getRentalDetail(id);
  } catch {
    notFound();
  }

  const images = (rental.images as string[]) ?? [];
  const postId = rental.post_id ?? 0;

  // 조회수 증가는 응답 후로 미뤄 렌더를 막지 않는다.
  after(() => viewCountUp(postId));
  const { userId, initialLiked, initialReported } = await getUserLikeReportStatus(postId);

  let relatedItems: RelatedItem[] = [];
  if (rental.location) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("rentals")
      .select("id, post_id, images, price, posts(title)")
      .eq("location", rental.location)
      .neq("id", rental.id)
      .limit(8);
    relatedItems = (data ?? []).map((item) => ({
      id: item.id,
      href: `/rental/${item.post_id}`,
      imageSrc: ((item.images as string[]) ?? [])[0] ?? null,
      title: (item.posts as { title: string | null } | null)?.title ?? "",
      priceText: formatPrice(item.price),
    }));
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: rental.posts.title,
    description: rental.description?.slice(0, 160),
    image: images[0],
    offers: {
      "@type": "Offer",
      price: rental.price,
      priceCurrency: "PHP",
      priceSpecification: { "@type": "UnitPriceSpecification", unitCode: "MON" },
    },
  };

  return (
    <div className="page-container pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex items-center justify-between mt-4">
        <BackButton />
        <VerifyAuthor
          authorAuthId={rental.posts.users?.auth_id}
          editPath={`/rental/${id}/edit`}
          postId={postId}
          redirectPath="/rental"
        />
      </div>
      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-2 md:gap-4 mt-4">
          <ImageCarousel images={images} />
          <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between gap-4 min-h-112.5">
            <AccommondationInfo rental={rental} />
            <hr className="border-gray-200" />
            <RentSellerInfo rental={rental} userId={userId} />
          </div>
        </div>
      ) : (
        
        <div className="border border-gray-200 rounded-2xl overflow-hidden mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <div className="p-6 flex flex-col gap-4">
              <AccommondationInfo rental={rental} />
            </div>
            <div className="p-6 flex flex-col gap-4">
              <RentSellerInfo rental={rental} userId={userId} />
            </div>
          </div>
        </div>
      )}
      <PostInfo
        rental={rental}
        userId={userId}
        postId={postId}
        initialLiked={initialLiked}
        initialReported={initialReported}
      />
      <RelatedItemsCarousel title="관련 매물" items={relatedItems} />
    </div>
  );
}
