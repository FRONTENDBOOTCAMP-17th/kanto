import { Rental } from "@/type/rental/rental";
import {
  Wifi,
  Wind,
  Car,
  UtensilsCrossed,
  Tv,
  Dumbbell,
  Waves,
  PawPrint,
  WashingMachine,
  Refrigerator,
  Shield,
} from "lucide-react";
import { ReactNode } from "react";

const AMENITY_ICONS: Record<string, ReactNode> = {
  와이파이: <Wifi className="w-4 h-4" />,
  인터넷: <Wifi className="w-4 h-4" />,
  에어컨: <Wind className="w-4 h-4" />,
  주차: <Car className="w-4 h-4" />,
  주방: <UtensilsCrossed className="w-4 h-4" />,
  TV: <Tv className="w-4 h-4" />,
  헬스장: <Dumbbell className="w-4 h-4" />,
  수영장: <Waves className="w-4 h-4" />,
  "반려동물 허용": <PawPrint className="w-4 h-4" />,
  세탁기: <WashingMachine className="w-4 h-4" />,
  냉장고: <Refrigerator className="w-4 h-4" />,
  금고: <Shield className="w-4 h-4" />,
};

export default function AccommondationInfo({ rental }: { rental: Rental }) {
  const amenities = (rental.amenities as string[]) ?? [];

  return (
    <>
      <h2 className="text-xl font-semibold">숙소 정보</h2>

      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <span
              key={amenity}
              className="flex items-center gap-1 border border-teal-400 text-teal-600 rounded-full px-3 py-1 text-sm"
            >
              {AMENITY_ICONS[amenity]}
              {amenity}
            </span>
          ))}
        </div>
      )}

      <hr className="border-gray-200" />

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-gray-500 font-medium">보증금</dt>
        <dd className="text-teal-600 font-semibold">
          · ₱{rental.deposit?.toLocaleString()}
        </dd>
        <dt className="text-gray-500 font-medium">월세</dt>
        <dd className="text-orange-500 font-semibold">
          · ₱{rental.price?.toLocaleString()}
        </dd>
        <dt className="text-gray-500 font-medium">방 타입</dt>
        <dd>· {rental.room_type}</dd>
        <dt className="text-gray-500 font-medium">최대 인원</dt>
        <dd>· {rental.max_occupants}명</dd>
        <dt className="text-gray-500 font-medium">위치</dt>
        <dd className="text-teal-600">· {rental.location}</dd>
      </dl>
    </>
  );
}
