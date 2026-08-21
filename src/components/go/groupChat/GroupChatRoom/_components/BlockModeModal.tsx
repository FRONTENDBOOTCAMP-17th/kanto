"use client";

import { useTranslations } from "next-intl";

interface Props {
  onConfirm: (mode: "room" | "global") => void;
  onCancel: () => void;
}

export default function BlockModeModal({ onConfirm, onCancel }: Props) {
  const t = useTranslations("Go.chat");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-semibold text-gray-800">
          {t("blockHow")}
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          {t("blockDescRoom")}
          <br />
          {t("blockDescGlobal")}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onConfirm("room")}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t("blockRoomOnly")}
          </button>
          <button
            onClick={() => onConfirm("global")}
            className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
          >
            {t("blockGlobal")}
          </button>
          <button
            onClick={onCancel}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
