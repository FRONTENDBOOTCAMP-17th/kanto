import { ClipboardList, Crown, ShieldCheck, X } from "lucide-react";
import type { AuditLog } from "@/services/admin/auditLog";
import { TARGET_LABELS, formatDate } from "./auditLogConfig";
import { ActionBadge } from "./ActionBadge";

interface Props {
  log: AuditLog;
  onClose: () => void;
}

export function DetailDrawer({ log, onClose }: Props) {
  const entries = Object.entries(log.detail);

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-end justify-end bg-black/20 backdrop-blur-sm sm:items-start"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white shadow-[0_0_40px_rgba(0,0,0,0.14)] sm:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ebeef0] bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-teal-500" strokeWidth={2} />
            <span className="text-[15px] font-semibold text-slate-800">로그 상세</span>
            <span className="text-[13px] text-slate-400">#{log.id}</span>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <div className="rounded-2xl border border-[#ebeef0] bg-slate-50 p-4">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">액션</p>
            <ActionBadge action={log.action} />
          </div>

          <div className="rounded-2xl border border-[#ebeef0] bg-white p-4">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">행위자</p>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${log.actor_role === "super_admin" ? "bg-amber-100" : "bg-teal-50"}`}
              >
                {log.actor_role === "super_admin" ? (
                  <Crown className="h-4 w-4 text-amber-500" strokeWidth={2} />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-teal-500" strokeWidth={2} />
                )}
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800">{log.actor_nickname}</p>
                <p className="text-[12px] text-slate-400">
                  {log.actor_role === "super_admin" ? "슈퍼어드민" : "어드민"} · ID {log.actor_id}
                </p>
              </div>
            </div>
          </div>

          {log.target_type && (
            <div className="rounded-2xl border border-[#ebeef0] bg-white p-4">
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">대상</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13.5px] font-semibold text-slate-800">{log.target_label ?? `#${log.target_id}`}</p>
                  <p className="text-[12px] text-slate-400">
                    {TARGET_LABELS[log.target_type]}
                    {log.target_id ? ` · ID ${log.target_id}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-[#ebeef0] bg-slate-50 px-2.5 py-0.5 text-[12px] font-medium text-slate-500">
                  {TARGET_LABELS[log.target_type]}
                </span>
              </div>
            </div>
          )}

          {entries.length > 0 && (
            <div className="rounded-2xl border border-[#ebeef0] bg-white p-4">
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">상세 정보</p>
              <div className="flex flex-col gap-2">
                {entries.map(([key, val]) => (
                  <div key={key} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="shrink-0 text-[12px] font-semibold text-slate-500">{key}</span>
                    <span className="min-w-0 break-all text-[12px] text-slate-700">
                      {typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[#ebeef0] bg-white p-4">
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-400">발생 시각</p>
            <p className="text-[13.5px] font-semibold text-slate-800">{formatDate(log.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
