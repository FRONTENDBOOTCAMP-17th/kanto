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
import { ApproxAreaMap } from "@/components/common/ApproxAreaMap";
import { formatBarangayLabel } from "@/type/location";
import { formatPrice } from "@/utils/format";

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

export default function AccommondationInfo({ rental, children }: { rental: Rental; children?: React.ReactNode }) {
  const t = useTranslations("Rental");
  const te = useTranslations("Enums");
  const amenities = (rental.amenities as string[]) ?? [];

  const amenityLabel = (amenity: string) =>
    te.has(`amenities.${amenity}`) ? te(`amenities.${amenity}`) : amenity;

  
  const enumLabel = (group: string, value: string | null) =>
    value ? (te.has(`${group}.${value}`) ? te(`${group}.${value}`) : value) : "";

  return (
    <>
      <h2 className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase">{t("accommodationInfo")}</h2>

      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {amenities.map((amenity) => (
            <span
              key={amenity}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-600 rounded-sm px-2.5 py-1 text-xs"
            >
              {AMENITY_ICONS[amenity]}
              <span>{amenityLabel(amenity)}</span>
            </span>
          ))}
        </div>
      )}

      <hr className="border-gray-200" />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm flex-1">
          <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("deposit")}</dt>
          <dd className="text-gray-900 font-medium">
            {formatPrice(rental.deposit)}
          </dd>
          <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{enumLabel("rentType", rental.rent_type)}</dt>
          <dd className="text-gray-900 font-semibold">
            {formatPrice(rental.price)}
          </dd>
          <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("roomType")}</dt>
          <dd className="text-gray-900">{enumLabel("roomType", rental.room_type)}</dd>
          <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("maxOccupants")}</dt>
          <dd className="text-gray-900">{t("occupantsValue", { count: rental.max_occupants ?? 0 })}</dd>
          <dt className="text-xs font-medium tracking-widest text-gray-400 uppercase self-center">{t("location")}</dt>
          <dd className="text-gray-900">
            {rental.location_barangay || rental.location_city
              ? formatBarangayLabel(rental.location_barangay, rental.location_city)
              : rental.location === "그 외 지역"
                ? te("tradeLocation.otherAreas")
                : rental.location}
          </dd>
        </dl>
        {children && <div className="w-full lg:w-56 shrink-0">{children}</div>}
      </div>

      {rental.location_lat != null && rental.location_lng != null && (
        <ApproxAreaMap
          lat={rental.location_lat}
          lng={rental.location_lng}
        />
      )}
    </>
  );
}
