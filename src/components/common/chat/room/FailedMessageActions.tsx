"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, RotateCw, X } from "lucide-react";

interface Props {
  failedLabel: string;
  retryLabel: string;
  deleteLabel: string;
  onRetry: () => void;
  onDelete: () => void;
}

/** 데스크탑(md 이상): 시간 자리에 `전송 실패 [↻][✕]`를 표시한다. */
export default function FailedMessageActions({
  failedLabel,
  retryLabel,
  deleteLabel,
  onRetry,
  onDelete,
  textClassName = "text-xs",
}: Props & { textClassName?: string }) {
  return (
    <div className="hidden items-center gap-1 md:flex">
      <span className={`text-red-500 ${textClassName}`}>{failedLabel}</span>
      <button
        type="button"
        onClick={onRetry}
        aria-label={retryLabel}
        title={retryLabel}
        className="cursor-pointer rounded-full p-1 text-gray-500 hover:bg-gray-100"
      >
        <RotateCw className="size-3" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={deleteLabel}
        title={deleteLabel}
        className="-ml-1 cursor-pointer rounded-full p-1 text-gray-500 hover:bg-gray-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

/** 모바일: 시간 자리에 `전송 실패 [!]`를 한 줄로 표시하고, 탭하면 재전송·삭제 메뉴가 열린다. */
export function FailedMessageBadge({
  failedLabel,
  retryLabel,
  deleteLabel,
  onRetry,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-10 cursor-pointer items-end px-1"
      >
        <span className="flex items-center gap-1">
          <span className="text-[11px] leading-none text-red-500">{failedLabel}</span>
          <CircleAlert className="size-4 text-red-500" />
        </span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-10 mb-1 w-28 overflow-hidden rounded-xl border border-gray-200 bg-white text-sm shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRetry();
            }}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2 px-4 text-gray-600 active:bg-gray-100"
          >
            <RotateCw className="size-4" />
            {retryLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2 border-t border-gray-100 px-4 text-gray-600 active:bg-gray-100"
          >
            <X className="size-4" />
            {deleteLabel}
          </button>
        </div>
      )}
    </div>
  );
}
