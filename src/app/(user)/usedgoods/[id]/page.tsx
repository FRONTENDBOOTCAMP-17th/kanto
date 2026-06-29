export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { after } from "next/server";
import { getUsedGoodsItem } from "@/services/usedGoods/usedGoods";
import { supabase } from "@/lib/supabase";
import UsedGoodsDetail from "@/app/(user)/usedgoods/[id]/_components/UsedGoodsDetail";
import { viewCountUp } from "@/services/view";
import { getUserLikeReportStatus } from "@/services/getUserLikeReportStatus";
export { generateMetadata } from "./metadata";

export default async function UsedGoodsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getUsedGoodsItem(Number(id));

  if (!data) notFound();

  // 본문(data) 외 나머지는 서로 독립이라 병렬로 가져온다(직렬 워터폴 제거).
  const [{ data: relatedData }, { userId, initialLiked, initialReported }] =
    await Promise.all([
      supabase
        .from("used_goods")
        .select(`*, posts (title)`)
        .eq("category", data.category ?? "")
        .neq("id", data.id)
        .limit(8),
      getUserLikeReportStatus(data.post_id),
    ]);

  // 조회수 증가는 강한 일관성이 필요 없으므로 응답 후로 미뤄 렌더를 막지 않는다.
  after(() => viewCountUp(data.post_id));

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
      <UsedGoodsDetail
        data={data}
        relatedData={relatedData}
        initialLiked={initialLiked}
        userId={userId}
        initialReported={initialReported}
      />
    </div>
  );
}
