import { ACTION_META } from "./auditLogConfig";

export function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action];
  if (!meta) return <span className="text-[12px] text-slate-400">{action}</span>;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${meta.color} ${meta.bg} ${meta.border}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}
