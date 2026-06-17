import { RentalWithPost } from "@/type/rental/rentalDetail";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RentSellorInfo({ rental }: { rental: RentalWithPost }) {
  const t = useTranslations("Rental");
  const tt = useTranslations("Time");
  const createdAt = rental.posts.users.created_at;
  const joined = createdAt ? new Date(createdAt) : null;

  return (
    <>
      <h2 className="text-xl font-medium">{t("landlordInfo")}</h2>
      <div className="flex items-center gap-3">
        {rental.posts.users.avatar_url ? (
          <Image
            src={rental.posts.users.avatar_url}
            alt={t("profileAlt")}
            width={48}
            height={48}
            className="rounded-full object-cover w-12 h-12"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-purple-400 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
        )}
        <div>
          <p>{rental.posts.users.name}</p>
          <p className="text-sm text-gray-500">
            {joined
              ? tt("joinedYearMonth", {
                  year: joined.getFullYear(),
                  month: joined.getMonth() + 1,
                })
              : tt("joinDateUnknown")}
          </p>
        </div>
      </div>

      <Button variant="teal" className="cursor-pointer">
        {t("inquire")}
      </Button>
    </>
  );
}
