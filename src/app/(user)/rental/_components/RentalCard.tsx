import { Wifi, AirVent, Car, Utensils } from "lucide-react";
import { ContentCard } from "@/components/common/ContentCard";

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  aircon: AirVent,
  parking: Car,
  kitchen: Utensils,
};

interface RentalCardProps {
  id: number;
  title: string;
  price: number | null;
  location: string | null;
  locationDetail: string | null;
  createdAt: string;
  images: string[];
  amenities: string[];
  likeCount: number;
  initialIsLiked: boolean;
  currentUserId: number | null;
}

export function RentalCard({
  id,
  title,
  price,
  location,
  locationDetail,
  createdAt,
  images,
  amenities,
  likeCount,
  initialIsLiked,
  currentUserId,
}: RentalCardProps) {
  const displayLocation =
    location === "그 외 지역" ? (locationDetail ?? location) : location;

  const visibleAmenities = amenities.filter((a) => a in AMENITY_ICONS);
  const amenityTags = visibleAmenities.length > 0 ? (
    <>
      {visibleAmenities.map((amenity) => {
        const Icon = AMENITY_ICONS[amenity];
        return (
          <div
            key={amenity}
            className="w-6 h-6 bg-teal-50 rounded flex items-center justify-center"
            title={amenity}
          >
            <Icon className="w-4 h-4 text-teal-600" />
          </div>
        );
      })}
    </>
  ) : undefined;

  return (
    <ContentCard
      href={`/rental/${id}`}
      images={images}
      title={title}
      price={price}
      location={displayLocation}
      createdAt={createdAt}
      likeCount={likeCount}
      postId={id}
      initialIsLiked={initialIsLiked}
      currentUserId={currentUserId}
      tags={amenityTags}
    />
  );
}
