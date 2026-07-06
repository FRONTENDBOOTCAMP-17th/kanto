"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations("Common");
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-80 rounded-sm bg-white px-8 py-10 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-lg font-bold tracking-tight text-gray-900">{title}</p>
        {description && (
          <p className="mt-2 text-center text-sm text-gray-500">{description}</p>
        )}
        <Button
          className="mt-6 w-full rounded-sm bg-rose-300 hover:bg-rose-400 text-white text-xs tracking-widest cursor-pointer hover:scale-105 active:scale-100 transition-all"
          onClick={onConfirm}
        >
          {confirmLabel ?? t("confirm")}
        </Button>
      </div>
    </div>,
    document.body,
  );
}
