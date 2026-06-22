import { Check, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  showMessage: boolean;
  type?: "success" | "error";
}

export default function Toast({
  message,
  showMessage,
  type = "success",
}: ToastProps) {
  const Icon = type === "error" ? AlertCircle : Check;
  return (
    <div
      role="status"
      className={`fixed bottom-7 left-1/2 z-80 flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-slate-900 px-5 py-3.25 text-white shadow-[0_10px_30px_rgba(15,23,42,0.3)] transition-all duration-300 ${
        showMessage
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <Icon
        className={`size-4.25 ${type === "error" ? "text-red-400" : "text-emerald-400"}`}
        strokeWidth={2.4}
      />
      <span className="text-[13.5px] font-semibold">{message}</span>
    </div>
  );
}
