"use client";

import { MoveLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BackButton() {
  const t = useTranslations("Job");
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("fromPage");
  return (
    <button
      onClick={() => router.push(fromPage ? `/job?page=${fromPage}` : "/job")}
      className="flex gap-2 cursor-pointer"
    >
      <MoveLeft />
      {t("backToList")}
    </button>
  );
}
