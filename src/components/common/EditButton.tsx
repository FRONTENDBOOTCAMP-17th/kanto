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
      className="cursor-pointer text-sm text-gray-500 transition-colors hover:underline"
    >
      {t("edit")}
    </button>
  );
}
