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
        className="cursor-pointer text-sm text-red-500 transition-colors hover:underline"
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
