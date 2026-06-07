import { supabase } from "@/lib/supabase";
import UsedGoodsDetail from "@/app/(user)/usedgoods/[id]/_components/UsedGoodsDetail";

export default async function UsedGoodsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await supabase
    .from("used_goods")
    .select(`*, posts (*, users (*))`)
    .eq("post_id", id)
    .single();

  if (!data) {
    return <div>상품을 찾을 수 없습니다.</div>;
  }

  return (
    <div>
      <UsedGoodsDetail data={data} />
    </div>
  );
}
