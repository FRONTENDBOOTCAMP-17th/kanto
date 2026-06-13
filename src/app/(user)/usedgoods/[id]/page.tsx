export const dynamic = "force-dynamic";

import { getUsedGoodsItem } from "@/services/usedGoods/usedGoods";
import { supabase } from "@/lib/supabase";
import UsedGoodsDetail from "@/app/(user)/usedgoods/[id]/_components/UsedGoodsDetail";
import { createClient } from "@/utils/supabase/server";

export default async function UsedGoodsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getUsedGoodsItem(Number(id));

  if (!data) {
    return <div>상품을 찾을 수 없습니다.</div>;
  }

  const { data: relatedData } = await supabase
    .from("used_goods")
    .select(`*, posts (*, users (*))`)
    .eq("category", data.category ?? "")
    .neq("id", data.id)
    .limit(8);

  const serverSupabase = await createClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  const { data: userData } = user
    ? await serverSupabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single()
    : { data: null };

  const { data: likeData } = userData
    ? await serverSupabase
        .from("common_likes")
        .select("id")
        .eq("target_id", data.post_id)
        .eq("target_type", "post")
        .eq("user_id", userData.id)
        .single()
    : { data: null };

  const { data: reportData } = userData
    ? await serverSupabase
        .from("common_reports")
        .select("id")
        .eq("target_id", data.post_id)
        .eq("target_type", "post")
        .eq("user_id", userData.id)
        .single()
    : { data: null };

  return (
    <div>
      <UsedGoodsDetail
        data={data}
        relatedData={relatedData}
        user={user}
        initialLiked={!!likeData}
        userId={userData?.id}
        initialReported={!!reportData}
      />
    </div>
  );
}
