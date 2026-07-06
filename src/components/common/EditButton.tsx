"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface EditButtonProps {
  editPath: string;
}

export default function EditButton({ editPath }: EditButtonProps) {
  const t = useTranslations("Common");
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(editPath)}
      className="cursor-pointer text-xs font-medium text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors active:scale-105"
    >
      {t("edit")}
    </button>
  );
}
