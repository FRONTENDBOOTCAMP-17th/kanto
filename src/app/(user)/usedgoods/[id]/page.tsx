import { getUsedGoodsItem } from "@/services/usedGoods/usedGoods";
import UsedGoodsDetail from "@/app/(user)/usedgoods/[id]/_components/UsedGoodsDetail";

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

  return (
    <div>
      <UsedGoodsDetail data={data} />
    </div>
  );
}
