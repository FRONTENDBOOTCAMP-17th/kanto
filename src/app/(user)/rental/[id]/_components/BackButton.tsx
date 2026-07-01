"use client";

import { ChevronLeft } from "lucide-react";
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
      className="flex gap-2 cursor-pointer"
    >
      <ChevronLeft />
      {t("backToList")}
    </button>
  );
}
