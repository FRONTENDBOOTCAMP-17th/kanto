"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BadgeCheck, MapPin } from "lucide-react";
import type { PublicProfile } from "@/services/user/publicProfile";
import { MangoIndex } from "./MangoIndex";

interface Props {
  profile: PublicProfile;
  reviewCount: number;
}

export function PublicProfileCard({ profile, reviewCount }: Props) {
  const t = useTranslations("PublicProfile");
  const tt = useTranslations("Time");

  const joinedAt = profile.createdAt ? new Date(profile.createdAt) : null;

  return (
    <div className="flex flex-col items-center gap-4 px-5 py-8">
      <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-3xl font-bold overflow-hidden shrink-0">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={profile.name}
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        ) : (
          profile.name.charAt(0)
        )}
      </div>

      <p className="text-xl font-bold text-gray-900">{profile.name}</p>

      <p className="text-sm text-gray-400">
        {joinedAt
          ? tt("joinedYearMonth", {
              year: joinedAt.getFullYear(),
              month: joinedAt.getMonth() + 1,
            })
          : tt("joinDateUnknown")}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge
          active={profile.identityVerified}
          label={
            profile.identityVerified
              ? t("identityVerified")
              : t("identityUnverified")
          }
          icon={<BadgeCheck className="w-3.5 h-3.5" />}
        />
        <Badge
          active={profile.neighborhoodVerified}
          label={
            profile.neighborhoodVerified
              ? t("neighborhoodVerified")
              : t("neighborhoodUnverified")
          }
          icon={<MapPin className="w-3.5 h-3.5" />}
        />
      </div>

      <div className="mt-2 grid grid-cols-3 w-full max-w-xs items-center divide-x divide-gray-100 rounded-xl border border-gray-100 py-3">
        <Stat value={profile.postCount} label={t("posts")} />
        <Stat value={reviewCount} label={t("reviews")} />
        <div className="flex items-center justify-center">
          <MangoIndex userId={profile.id} />
        </div>
      </div>
    </div>
  );
}

function Badge({
  active,
  label,
  icon,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? "bg-teal-50 text-teal-600" : "bg-gray-100 text-gray-400"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
