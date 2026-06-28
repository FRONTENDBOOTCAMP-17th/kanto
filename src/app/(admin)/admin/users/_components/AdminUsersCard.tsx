import { User } from "@/services/admin/adminUsers";
import { CalendarDays, Mail, FileText } from "lucide-react";
import { formatDate } from "@/utils/formatTime";

interface AdminUsersCardProps {
  users: User[];
  onOpen: (userId: number) => void;
}

export default function AdminUsersCard({ users, onOpen }: AdminUsersCardProps) {
  return (
    <div className="space-y-3 p-4">
      {users.map((user) => {
        const hasPending = user.pending_report_count > 0;
        return (
          <div
            key={user.id}
            className="rounded-[14px] border border-[#e7ebee] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="block truncate text-[15px] font-extrabold text-slate-900">
                  {user.name}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-slate-500">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{user.email ?? "-"}</span>
                </span>
              </div>
              {hasPending && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                  신고 {user.pending_report_count}건
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-[12.5px] text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  글 {(user.post_count ?? 0).toLocaleString()}개
                </span>
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  {formatDate(user.created_at)}
                </span>
              </div>
              <button
                onClick={() => onOpen(user.id)}
                className={[
                  "cursor-pointer shrink-0 rounded-[9px] px-3.5 py-1.5 text-[12px]",
                  hasPending
                    ? "bg-teal-500 font-bold text-white"
                    : "border border-[#e2e8eb] bg-white font-semibold text-slate-600",
                ].join(" ")}
              >
                {hasPending ? "검토" : "상세"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
