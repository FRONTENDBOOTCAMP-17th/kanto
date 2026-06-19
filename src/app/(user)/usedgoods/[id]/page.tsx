export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getUsedGoodsItem } from "@/services/usedGoods/usedGoods";
import { supabase } from "@/lib/supabase";
import UsedGoodsDetail from "@/app/(user)/usedgoods/[id]/_components/UsedGoodsDetail";
import { viewCountUp } from "@/services/view";
import { getUserLikeReportStatus } from "@/services/getUserLikeReportStatus";

export default async function UsedGoodsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getUsedGoodsItem(Number(id));

  if (!data) notFound();

  const { data: relatedData } = await supabase
    .from("used_goods")
    .select(`*, posts (*, users (id, name, avatar_url, auth_id, role, post_count, created_at))`)
    .eq("category", data.category ?? "")
    .neq("id", data.id)
    .limit(8);

  const { userId, initialLiked, initialReported } = await getUserLikeReportStatus(data.post_id);

  await viewCountUp(data.post_id);

  return (
    <div>
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
