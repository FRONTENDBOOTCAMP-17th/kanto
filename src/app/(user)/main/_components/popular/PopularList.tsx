import { ChevronRight } from "lucide-react";
import MainCard, { type MainCardItem } from "../MainCard";
import { getUsedGoodsList } from "@/services/usedGoods/usedGoods";
import { formatTimeAgo } from "@/utils/formatTime";


export default async function PopularList() {
  const data = await getUsedGoodsList();

  const items: MainCardItem[] = data
    .filter((post) => post.used_goods[0] != null)
    .slice(0, 4)
    .map((post) => {
    const goods = post.used_goods[0];
    return {
      id: post.id,
      title: post.title,
      price: goods.price,
      location: goods.location_type,
      likes: post.like_count,
      time: formatTimeAgo(post.created_at),
      popular: post.like_count >= 20,
      imageSrc: (goods.images as string[] | null)?.[0],
    };
  });

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">중고거래</h2>
        <button className="flex gap-1 cursor-pointer items-center text-teal-500 font-medium text-sm">
          전체보기
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 md:grid md:grid-cols-4 md:gap-4">
        {items.map((item) => (
          <MainCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
