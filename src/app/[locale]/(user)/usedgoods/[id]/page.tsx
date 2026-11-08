import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPublicUsedGoodsItem } from "@/services/usedGoods/usedGoods";
import { createPublicClient } from "@/utils/supabase/public";
import UsedGoodsDetail from "@/app/[locale]/(user)/usedgoods/[id]/_components/UsedGoodsDetail";
import { ViewCounter } from "@/components/common/ViewCounter";
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

export default async function UsedGoodsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const postId = resolvePostId(id);
  if (postId === null) notFound();

  const rawData = await getPublicUsedGoodsItem(postId);

  if (!rawData || !rawData.posts) notFound();

  const data = {
    ...rawData,
    id_token: encryptPostId(rawData.post_id),
    posts: {
      ...rawData.posts,
      users: rawData.posts.users
        ? { ...rawData.posts.users, id_token: encryptUserId(rawData.posts.users.id ?? 0) }
        : rawData.posts.users,
    },
  };

  const { data: rawRelatedData } = await createPublicClient()
    .from("used_goods")
    .select(`*, posts!inner (title, is_sold)`)
    .eq("category", data.category ?? "")
    .eq("posts.status", "active")
    .neq("id", data.id)
    .limit(8);

  const relatedData = (rawRelatedData ?? []).map((item) => ({
    ...item,
    id_token: encryptPostId(item.post_id),
  }));


  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: (data.posts as { title: string } | null)?.title,
    description: data.content?.slice(0, 160),
    image: (data.images as string[] | null)?.[0],
    offers: {
      "@type": "Offer",
      price: data.price,
      priceCurrency: "PHP",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewCounter postId={data.post_id} />
      <UsedGoodsDetail
        data={data as unknown as Parameters<typeof UsedGoodsDetail>[0]["data"]}
        relatedData={relatedData}
      />
    </div>
  );
}
