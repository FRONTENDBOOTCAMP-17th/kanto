import { notFound } from "next/navigation";
import { getUsedGoodsDetail } from "@/services/usedGoods/usedGoods";
import { CreateUsedGoodsForm } from "@/app/[locale]/(user)/usedgoods/create/_components/CreateUsedGoodsForm";
import { resolvePostId } from "@/utils/postIdCipher";

// 로그인 사용자 쿠키를 읽는 화면이므로 항상 동적 렌더링한다.
// (명시하지 않으면 try/catch로 감싼 cookies() 호출이 빌드 시 정적 렌더링으로 잘못 굳을 수 있다)
export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = resolvePostId(id);
  if (postId === null) notFound();
  const data = await getUsedGoodsDetail(postId);

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
        location_barangay: data.used_goods[0].location_barangay,
        location_city: data.used_goods[0].location_city,
        location_lat: data.used_goods[0].location_lat,
        location_lng: data.used_goods[0].location_lng,
        content: data.used_goods[0].content,
        safe_payment: data.used_goods[0].safe_payment,
        images: data.used_goods[0].images as string[] | null,
      }}
    />
  );
}
