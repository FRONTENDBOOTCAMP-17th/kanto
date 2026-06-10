export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import UsedGoodsDetail from "@/app/(user)/usedgoods/[id]/_components/UsedGoodsDetail";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function UsedGoodsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await supabase
    .from("used_goods")
    .select(`*, posts (*, users (*))`)
    .eq("post_id", Number(id))
    .single();

  if (!data) {
    return <div>상품을 찾을 수 없습니다.</div>;
  }

  const { data: relatedData } = await supabase
    .from("used_goods")
    .select(`*, posts (*, users (*))`)
    .eq("category", data.category ?? "")
    .neq("id", data.id)
    .limit(8);

  const serverSupabase = await createSupabaseServerClient();
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

  return (
    <div>
      <UsedGoodsDetail
        data={data}
        relatedData={relatedData}
        user={user}
        initialLiked={!!likeData}
        userId={userData?.id}
      />
    </div>
  );
}
