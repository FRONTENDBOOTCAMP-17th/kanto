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
      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer active:scale-100"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
  );
}
