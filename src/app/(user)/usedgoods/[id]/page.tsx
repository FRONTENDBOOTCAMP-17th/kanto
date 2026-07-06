export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { after } from "next/server";
import { getUsedGoodsItem } from "@/services/usedGoods/usedGoods";
import { supabase } from "@/lib/supabase";
import UsedGoodsDetail from "@/app/(user)/usedgoods/[id]/_components/UsedGoodsDetail";
import { viewCountUp } from "@/services/view";
import { getUserLikeReportStatus } from "@/services/getUserLikeReportStatus";
import { resolvePostId, encryptPostId } from "@/utils/postIdCipher";
import { encryptUserId } from "@/utils/userIdCipher";
export { generateMetadata } from "./metadata";

export default async function UsedGoodsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = resolvePostId(id);
  if (postId === null) notFound();

  const rawData = await getUsedGoodsItem(postId);

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

  const [{ data: rawRelatedData }, { userId, initialLiked, initialReported }] =
    await Promise.all([
      supabase
        .from("used_goods")
        .select(`*, posts!inner (title, is_sold)`)
        .eq("category", data.category ?? "")
        .eq("posts.status", "active")
        .neq("id", data.id)
        .limit(8),
      getUserLikeReportStatus(data.post_id),
    ]);

  const relatedData = (rawRelatedData ?? []).map((item) => ({
    ...item,
    id_token: encryptPostId(item.post_id),
  }));


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
        data={data as unknown as Parameters<typeof UsedGoodsDetail>[0]["data"]}
        relatedData={relatedData}
        initialLiked={initialLiked}
        userId={userId}
        initialReported={initialReported}
      />
    </div>
  );
}
