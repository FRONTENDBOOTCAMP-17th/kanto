import type { Rental } from "@/type/rental/rentalList";
import {
  Wifi,
  Wind,
  SquareParking,
  UtensilsCrossed,
  Tv,
  Dumbbell,
  Waves,
  PawPrint,
  WashingMachine,
  Refrigerator,
  Vault,
  ShieldUser,
} from "lucide-react";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ApproxAreaMapWithProvider } from "@/components/common/ApproxAreaMap";
import { formatBarangayLabel } from "@/type/location";

const AMENITY_ICONS: Record<string, ReactNode> = {
  와이파이: <Wifi className="w-4 h-4" />,
  인터넷: <Wifi className="w-4 h-4" />,
  에어컨: <Wind className="w-4 h-4" />,
  주차: <SquareParking className="w-4 h-4" />,
  주방: <UtensilsCrossed className="w-4 h-4" />,
  TV: <Tv className="w-4 h-4" />,
  헬스장: <Dumbbell className="w-4 h-4" />,
  수영장: <Waves className="w-4 h-4" />,
  "반려동물 허용": <PawPrint className="w-4 h-4" />,
  세탁기: <WashingMachine className="w-4 h-4" />,
  냉장고: <Refrigerator className="w-4 h-4" />,
  금고: <Vault className="w-4 h-4" />,
  보안요원: <ShieldUser className="w-4 h-4" />,
};

export default function AccommondationInfo({ rental }: { rental: Rental }) {
  const t = useTranslations("Rental");
  const te = useTranslations("Enums");
  const amenities = (rental.amenities as string[]) ?? [];

  const amenityLabel = (amenity: string) =>
    te.has(`amenities.${amenity}`) ? te(`amenities.${amenity}`) : amenity;

  // 정식 값이 아닌 레거시 enum 값(예: rent_type "단기")은 번역 키가 없으므로 원본을 그대로 보여준다.
  const enumLabel = (group: string, value: string | null) =>
    value ? (te.has(`${group}.${value}`) ? te(`${group}.${value}`) : value) : "";

  return (
    <>
      <h2 className="text-xl font-medium">{t("accommodationInfo")}</h2>

      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <span
              key={amenity}
              className="flex items-center gap-1 bg-teal-50 text-teal-500 rounded-full px-3 py-1 text-sm"
            >
              {AMENITY_ICONS[amenity]}
              <span className="text-gray-700">{amenityLabel(amenity)}</span>
            </span>
          ))}
        </div>
      )}

      <hr className="border-gray-200" />

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-gray-500 font-medium">{t("deposit")}</dt>
        <dd className="text-gray-700">
          · ₱ {rental.deposit?.toLocaleString()}
        </dd>
        <dt className="text-gray-500 font-medium">{enumLabel("rentType", rental.rent_type)}</dt>
        <dd className="text-orange-500">
          · ₱ {rental.price?.toLocaleString()}
        </dd>
        <dt className="text-gray-500 font-medium">{t("roomType")}</dt>
        <dd>· {enumLabel("roomType", rental.room_type)}</dd>
        <dt className="text-gray-500 font-medium">{t("maxOccupants")}</dt>
        <dd>· {t("occupantsValue", { count: rental.max_occupants ?? 0 })}</dd>
        <dt className="text-gray-500 font-medium">{t("location")}</dt>
        <dd>
          ·{" "}
          {rental.location_barangay || rental.location_city
            ? formatBarangayLabel(rental.location_barangay, rental.location_city)
            : rental.location === "그 외 지역"
              ? te("tradeLocation.otherAreas")
              : rental.location}
        </dd>
      </dl>

      {rental.location_lat != null && rental.location_lng != null && (
        <ApproxAreaMapWithProvider
          lat={rental.location_lat}
          lng={rental.location_lng}
        />
      )}
    </>
  );
}
