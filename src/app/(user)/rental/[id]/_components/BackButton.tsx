"use client";

import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BackButton() {
  const t = useTranslations("Rental");
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/rental")}
      className="flex mx-2 my-4 gap-2 cursor-pointer"
    >
      <MoveLeft />
      {t("backToList")}
    </button>
  );
}
