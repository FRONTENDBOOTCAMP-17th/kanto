import { ContentCard } from "@/components/common/ContentCard";
import PopularBadge from "./PopularBadge";

export type MainCardItem = {
  id: number;
  href: string;
  title: string;
  price: number;
  location: string;
  likeCount: number;
  createdAt: string;
  popular: boolean;
  imageSrc?: string;
  initialIsLiked: boolean;
  currentUserId: number | null;
};

export default function MainCard({
  item,
  priority = false,
}: {
  item: MainCardItem;
  priority?: boolean;
}) {
  return (
    <ContentCard
      href={item.href}
      images={item.imageSrc ? [item.imageSrc] : []}
      title={item.title}
      price={item.price}
      location={item.location}
      createdAt={item.createdAt}
      likeCount={item.likeCount}
      postId={item.id}
      initialIsLiked={item.initialIsLiked}
      currentUserId={item.currentUserId}
      badge={item.popular ? <PopularBadge /> : undefined}
      listOnMobile
      priority={priority}
    />
  );
}
