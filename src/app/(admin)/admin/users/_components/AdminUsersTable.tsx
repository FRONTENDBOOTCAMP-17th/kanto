import { User } from "@/services/admin/adminUsers";
import { formatDate } from "@/utils/format";

interface AdminUsersTableProps {
  users: User[];
  onOpen: (userId: number) => void;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
}


export default function AdminUsersTable({
  users,
  onOpen,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
}: AdminUsersTableProps) {
  return (
    <table className="w-full min-w-[680px] border-collapse">
      <thead>
        <tr className="border-b border-[#f1f4f6] bg-slate-50">
          <th className="w-[44px] px-[18px] py-[13px] text-left">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              className="h-4 w-4 cursor-pointer align-middle accent-teal-500"
            />
          </th>
          {["이름", "이메일", "작성 글", "신고", "가입일"].map((h) => (
            <th
              key={h}
              className="px-[18px] py-[13px] text-left text-[12px] font-bold uppercase tracking-wide text-slate-400"
            >
              {h}
            </th>
          ))}
          <th className="px-[18px] py-[13px] text-right text-[12px] font-bold uppercase tracking-wide text-slate-400">
            액션
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const hasPending = user.pending_report_count > 0;
          return (
            <tr
              key={user.id}
              className="border-t border-[#f3f5f7] hover:bg-slate-50"
            >
              <td className="px-[18px] py-[15px]">
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.id)}
                  onChange={() => onToggleSelect(user.id)}
                  className="h-4 w-4 cursor-pointer align-middle accent-teal-500"
                />
              </td>
              <td className="px-[18px] py-[15px]">
                <span className="text-[14px] font-bold text-slate-900">
                  {user.name}
                </span>
              </td>
              <td className="px-[18px] py-[15px] text-[13.5px] text-slate-500">
                {user.email ?? "-"}
              </td>
              <td className="whitespace-nowrap px-[18px] py-[15px] text-[13.5px] font-semibold text-slate-600">
                {(user.post_count ?? 0).toLocaleString()}
              </td>
              <td className="px-[18px] py-[15px]">
                {hasPending ? (
                  <span
                    className="inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-1 text-[12px] font-semibold"
                    style={{ background: "#fef2f2", color: "#dc2626" }}
                  >
                    {user.pending_report_count}건
                  </span>
                ) : (
                  <span className="text-[13.5px] text-slate-300">-</span>
                )}
              </td>
              <td className="whitespace-nowrap px-[18px] py-[15px] text-[13.5px] text-slate-500">
                {formatDate(user.created_at)}
              </td>
              <td className="px-[18px] py-[15px]">
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => onOpen(user.id)}
                    className={[
                      "cursor-pointer whitespace-nowrap rounded-[9px] px-4 py-2 text-[13px]",
                      hasPending
                        ? "border-none bg-teal-500 font-bold text-white"
                        : "border border-[#e2e8eb] bg-white font-semibold text-slate-600",
                    ].join(" ")}
                  >
                    {hasPending ? "검토" : "상세"}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
