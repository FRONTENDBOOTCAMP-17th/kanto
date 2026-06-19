import { User } from "@/services/admin/adminUsers";

interface AdminUsersTableProps {
  users: User[];
  onOpen: (userId: number) => void;
}

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export default function AdminUsersTable({ users, onOpen }: AdminUsersTableProps) {
  return (
    <table className="w-full min-w-[680px] border-collapse">
      <thead>
        <tr className="border-b border-[#f1f4f6] bg-slate-50">
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
          const hasReport = user.report_count > 0;
          return (
            <tr
              key={user.id}
              className="border-t border-[#f3f5f7] hover:bg-slate-50"
            >
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
                {hasReport ? (
                  <span
                    className="inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-1 text-[12px] font-semibold"
                    style={{ background: "#fef2f2", color: "#dc2626" }}
                  >
                    {user.report_count}건
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
                      hasReport
                        ? "border-none bg-teal-500 font-bold text-white"
                        : "border border-[#e2e8eb] bg-white font-semibold text-slate-600",
                    ].join(" ")}
                  >
                    {hasReport ? "검토" : "상세"}
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
