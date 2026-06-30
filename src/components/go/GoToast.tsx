

import { X } from "lucide-react";

interface GoToastProps {
  message: string;
  error?: boolean;
  
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
