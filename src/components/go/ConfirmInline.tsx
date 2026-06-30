

import { AlertTriangle } from "lucide-react";

type Tone = "warning" | "danger";

interface ConfirmInlineProps {
  tone: Tone;
  title: string;
  description?: string;
  cancelLabel: string;
  confirmLabel: string;
  loadingLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const TONE: Record<Tone, { box: string; icon: string; confirm: string }> = {
  warning: {
    box: "border-orange-200 bg-orange-50",
    icon: "text-orange-700",
    confirm: "bg-orange-600 hover:bg-orange-700",
  },
  danger: {
    box: "border-rose-200 bg-rose-50",
    icon: "text-rose-600",
    confirm: "bg-rose-600 hover:bg-rose-700",
  },
};

export function ConfirmInline({
  tone,
  title,
  description,
  cancelLabel,
  confirmLabel,
  loadingLabel,
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmInlineProps) {
  const c = TONE[tone];
  return (
    <div className={`flex flex-col gap-3 rounded-[13px] border p-4 ${c.box}`}>
      <div className="flex items-start gap-2.5">
        <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${c.icon}`} strokeWidth={2.1} />
        <div>
          <div className="text-[14px] font-bold leading-snug text-slate-900">{title}</div>
          {description && <div className="mt-1 text-[13px] text-slate-500">{description}</div>}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-[10px] border border-slate-200 bg-white py-2.5 text-[13.5px] font-bold text-slate-600 hover:bg-slate-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 rounded-[10px] py-2.5 text-[13.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${c.confirm}`}
        >
          {loading ? (loadingLabel ?? confirmLabel) : confirmLabel}
        </button>
      </div>
    </div>
  );
}
