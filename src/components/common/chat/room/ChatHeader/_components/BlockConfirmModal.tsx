"use client";

import { useTranslations } from "next-intl";

interface Props {
  partnerName: string;
  isBlocking: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BlockConfirmModal({
  partnerName,
  isBlocking,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations("Chat");
  const tc = useTranslations("Common");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-semibold text-gray-800">
          {t("blockConfirmMessage", { name: partnerName })}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {tc("cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isBlocking}
            className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            {tc("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
