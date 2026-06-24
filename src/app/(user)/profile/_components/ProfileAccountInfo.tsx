"use client";

import { useTranslations } from "next-intl";

const PROVIDER_KEYS = ["google", "kakao", "facebook", "email"] as const;
type Provider = (typeof PROVIDER_KEYS)[number];

export function ProfileAccountInfo({
  provider,
  createdAt,
}: {
  provider: string | null;
  createdAt: string | null;
}) {
  const t = useTranslations("Profile.card");
  const tp = useTranslations("Profile.providers");
  const tt = useTranslations("Time");

  const providerKey: Provider = PROVIDER_KEYS.find((p) => p === provider) ?? "email";
  const joinedAt = createdAt ? new Date(createdAt) : null;

  return (
    <div className="flex flex-col gap-3 px-5 md:px-0">
      <h2 className="text-sm font-semibold text-gray-700">{t("account")}</h2>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{t("joinedAt")}</span>
        <span className="text-sm text-gray-700">
          {joinedAt
            ? tt("joinedYearMonth", { year: joinedAt.getFullYear(), month: joinedAt.getMonth() + 1 })
            : tt("joinDateUnknown")}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{t("provider")}</span>
        <span className="text-sm text-gray-700">{tp(providerKey)}</span>
      </div>
    </div>
  );
}
