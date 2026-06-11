import Image from "next/image";
import { Heart, ImageIcon, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import PopularBadge from "./PopularBadge";
import { LikeButton } from "@/components/common/LikeButton";

export type MainCardItem = {
  id: number;
  title: string;
  price: number;
  location: string;
  likes: number;
  time: string;
  popular: boolean;
  imageSrc?: string;
  initialIsLiked: boolean;
};

function Placeholder() {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <ImageIcon className="w-8 h-8 text-gray-300" />
    </div>
  );
}

export default function MainCard({ item }: { item: MainCardItem }) {
  return (
    <Card className="flex-row gap-3 p-3 md:flex-col md:p-0 md:gap-0">
      {/* 이미지 */}
      <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden md:w-full md:h-auto md:aspect-square md:rounded-none">
        {item.imageSrc ? (
          <Image src={item.imageSrc} alt={item.title} fill className="object-cover" />
        ) : (
          <Placeholder />
        )}
        {item.popular && <PopularBadge />}
        <LikeButton
          postId={item.id}
          initialIsLiked={item.initialIsLiked}
          className="hidden md:flex absolute top-2 right-2 w-8 h-8 bg-white rounded-full items-center justify-center shadow-sm cursor-pointer"
        />
      </div>

      {/* 콘텐츠 */}
      <section className="flex flex-col justify-between flex-1 min-w-0 py-0.5 md:p-3 md:gap-1">
        <h3 className="font-semibold text-sm truncate">{item.title}</h3>
        <p className="font-bold">₱{item.price.toLocaleString()}</p>
        <div className="flex justify-between text-xs text-gray-400">
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />
            {item.location}
          </span>
          {/* 모바일: 찜+시간 / 데스크탑: 시간만 */}
          <div className="flex gap-2 items-center md:hidden">
            <div className="flex items-center gap-0.5">
              <Heart className="w-3 h-3" />
              <span>{item.likes}</span>
            </div>
            <time dateTime="">{item.time}</time>
          </div>
          <time dateTime="" className="hidden md:block">{item.time}</time>
        </div>
        {/* 찜 수 - 데스크탑만 */}
        <div className="hidden md:flex items-center gap-0.5 text-xs text-gray-400">
          <Heart className="w-3 h-3" />
          <span>{item.likes}</span>
        </div>
      </section>
    </Card>
  );
}
