"use client";

import { MoveLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BackButton() {
  const t = useTranslations("Rental");
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("fromPage");
  return (
    <button
      onClick={() => router.push(fromPage ? `/rental?page=${fromPage}` : "/rental")}
      className="flex mx-2 my-4 gap-2 cursor-pointer"
    >
      <MoveLeft />
      {t("backToList")}
    </button>
  );
}
