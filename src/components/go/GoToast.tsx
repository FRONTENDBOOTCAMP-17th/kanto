// 칸토 go! 공용 토스트 — 상세 패널·단체채팅·어드민의 복붙 토스트 마크업 단일화.
// 상위에서 조건부 렌더(`{msg && <GoToast .../>}`)하며, 메시지가 비면 아무것도 렌더하지 않는다.

import { X } from "lucide-react";

interface GoToastProps {
  message: string;
  error?: boolean;
  /** 성공/실패 아이콘 표시 여부 (상세 패널·어드민) */
  showIcon?: boolean;
}

export function GoToast({ message, error = false, showIcon = false }: GoToastProps) {
  if (!message) return null;
  return (
    <div className="fixed bottom-7 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-xl bg-slate-900 px-5 py-3.5 text-[13.5px] font-semibold text-white shadow-2xl">
      {showIcon &&
        (error ? (
          <X className="h-4 w-4 text-rose-400" strokeWidth={2.5} />
        ) : (
          <span className="text-emerald-400">✓</span>
        ))}
      {message}
    </div>
  );
}
