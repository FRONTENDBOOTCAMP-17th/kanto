"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ConfirmModal } from "@/components/common/ConfirmModal";

interface DeleteButtonProps {
  postId: number;
  redirectPath: string;
}

export default function DeleteButton({ postId, redirectPath }: DeleteButtonProps) {
  const t = useTranslations("Common");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    setIsOpen(false);
    if (!res.ok) {
      alert(t("deleteFailed"));
      return;
    }
    router.push(redirectPath);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="cursor-pointer text-xs font-medium text-red-400 px-3 py-1.5 rounded-lg border border-red-100 bg-white hover:bg-red-50 transition-colors active:scale-105"
      >
        {t("delete")}
      </button>
      <ConfirmModal
        isOpen={isOpen}
        title={t("deleteConfirm")}
        confirmLabel={t("delete")}
        onConfirm={handleDelete}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
