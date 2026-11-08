import { notFound } from "next/navigation";
import { formatPrice } from "@/utils/format";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicRentalDetail } from "@/services/rental/rental";
import BackButton from "@/app/[locale]/(user)/rental/[id]/_components/BackButton";
import ImageCarousel from "@/app/[locale]/(user)/rental/[id]/_components/ImageCarresel";
import AccommondationInfo from "./_components/AccommondationInfo";
import RentSellerInfo from "./_components/RentSellerInfo";
import PostInfo from "./_components/PostInfo";
import VerifyAuthor from "@/components/common/VerifyAuthor";
import { ViewCounter } from "@/components/common/ViewCounter";
import { createPublicClient } from "@/utils/supabase/public";
import RelatedItemsCarousel, { type RelatedItem } from "@/components/common/RelatedItemsCarousel";
import { resolvePostId, encryptPostId } from "@/utils/postIdCipher";
import { encryptUserId } from "@/utils/userIdCipher";
export { generateMetadata } from "./metadata";

// 상세 페이지는 로그인 사용자와 무관한 공개 데이터만 서버에서 렌더링하고 ISR로 캐시한다.
// 좋아요·신고 여부, 작성자 여부, 조회수 증가는 클라이언트에서 처리한다.
export const revalidate = 300;

// 빌드 시 미리 만들지 않고 첫 방문 때 생성해 캐시한다.
export function generateStaticParams() {
  return [];
}

export default async function RentalDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const resolvedId = resolvePostId(id);
  if (resolvedId === null) notFound();

  let rawRental;
  try {
    rawRental = await getPublicRentalDetail(resolvedId);
  } catch {
    notFound();
  }

  const rental = {
    ...rawRental,
    id_token: encryptPostId(rawRental.post_id ?? resolvedId),
    posts: {
      ...rawRental.posts,
      users: rawRental.posts.users
        ? { ...rawRental.posts.users, id_token: encryptUserId(rawRental.posts.users.id) }
        : rawRental.posts.users,
    },
  };

  const images = (rental.images as string[]) ?? [];
  const postId = rental.post_id ?? 0;


  let relatedItems: RelatedItem[] = [];
  if (rental.location) {
    const supabase = createPublicClient();
    const [{ data }, tCommon] = await Promise.all([
      supabase
        .from("rentals")
        .select("id, post_id, images, price, posts!inner(title, is_sold)")
        .eq("location", rental.location)
        .eq("posts.status", "active")
        .neq("id", rental.id)
        .limit(8),
      getTranslations("Common"),
    ]);
    relatedItems = (data ?? []).map((item) => ({
      id: item.id,
      href: `/rental/${encryptPostId(item.post_id ?? 0)}`,
      imageSrc: ((item.images as string[]) ?? [])[0] ?? null,
      title: (item.posts as { title: string | null; is_sold: boolean } | null)?.title ?? "",
      priceText: formatPrice(item.price),
      overlayLabel: (item.posts as { is_sold: boolean } | null)?.is_sold
        ? tCommon("dealClosed")
        : undefined,
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
    <div className="page-container pb-28 md:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewCounter postId={postId} />
      <div className="flex items-center justify-between mt-4">
        <BackButton />
        <VerifyAuthor
          authorAuthId={rental.posts.users?.auth_id}
          editPath={`/rental/${rental.id_token}/edit`}
          postId={postId}
          redirectPath="/rental"
        />
      </div>
      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-4 md:gap-8 mt-4">
          <ImageCarousel images={images} />
          <div className="flex flex-col gap-6 pt-4 md:pt-0">
            <AccommondationInfo rental={rental}>
              <RentSellerInfo rental={rental} />
            </AccommondationInfo>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <div className="py-6 md:pr-8 flex flex-col gap-4">
              <AccommondationInfo rental={rental} />
            </div>
            <div className="py-6 md:pl-8 flex flex-col gap-4">
              <RentSellerInfo rental={rental} />
            </div>
          </div>
        </div>
      )}
      <hr className="border-gray-300 mt-10" />
      <PostInfo rental={rental} postId={postId} />
      <RelatedItemsCarousel title="관련 매물" items={relatedItems} />
    </div>
  );
}
