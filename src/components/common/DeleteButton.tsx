"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
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
    await supabase.from("posts").delete().eq("id", postId);
    setIsOpen(false);
    router.push(redirectPath);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="border-2 px-2 py-1 rounded-xl bg-red-600 border-red-600 text-white"
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
