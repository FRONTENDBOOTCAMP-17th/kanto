"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, RotateCw, X } from "lucide-react";

interface Props {
  failedLabel: string;
  retryLabel: string;
  deleteLabel: string;
  onRetry: () => void;
  onDelete: () => void;
  /** "전송 실패" 글자 크기 */
  textClassName?: string;
}

/**
 * 전송 실패 표시와 재전송·삭제.
 * 데스크탑은 `[↻][🗑] 전송 실패`, 모바일은 `전송 실패 [!]`이며 `!`를 탭하면 선택 메뉴가 열린다.
 */
export default function FailedMessageActions({
  failedLabel,
  retryLabel,
  deleteLabel,
  onRetry,
  onDelete,
  textClassName = "text-xs",
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
    <div ref={rootRef} className="relative flex items-center gap-1">
      <div className="order-1 hidden items-center gap-1 md:flex">
        <button
          type="button"
          onClick={onRetry}
          aria-label={retryLabel}
          title={retryLabel}
          className="cursor-pointer rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <RotateCw className="size-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={deleteLabel}
          title={deleteLabel}
          className="cursor-pointer rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <X className="size-4" />
        </button>
      </div>

      <span className={`order-2 text-red-500 ${textClassName}`}>{failedLabel}</span>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={failedLabel}
        aria-expanded={open}
        className="order-3 -my-2.5 flex size-10 cursor-pointer items-center justify-center md:hidden"
      >
        <CircleAlert className="size-5 text-red-500" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-10 mb-1 w-28 overflow-hidden rounded-xl border border-gray-200 bg-white text-sm shadow-lg md:hidden">
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
