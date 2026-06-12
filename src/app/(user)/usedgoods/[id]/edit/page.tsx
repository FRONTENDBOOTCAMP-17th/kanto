import { getUsedGoodsDetail } from "@/services/usedGoods/usedGoods";
import { CreateUsedGoodsForm } from "@/app/(user)/usedgoods/create/_components/CreateUsedGoodsForm";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getUsedGoodsDetail(Number(id));

  return (
    <CreateUsedGoodsForm
      userId={data.users.id}
      initialData={{
        post_id: data.used_goods[0].post_id,
        title: data.title,
        price: data.used_goods[0].price,
        condition: data.used_goods[0].condition,
        category: data.used_goods[0].category,
        location_type: data.used_goods[0].location_type,
        location_custom: data.used_goods[0].location_custom,
        content: data.used_goods[0].content,
        safe_payment: data.used_goods[0].safe_payment,
        images: data.used_goods[0].images as string[] | null,
      }}
    />
  );
}
