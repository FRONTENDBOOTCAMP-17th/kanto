import { Bell, Pencil, Trash2 } from "lucide-react";
import type { Notice } from "../page";

function statusLabel(startsAt: string, endsAt: string) {
  const now = new Date();
  if (now < new Date(startsAt)) return { text: "예정", color: "bg-amber-400" };
  if (now > new Date(endsAt)) return { text: "만료", color: "bg-slate-300" };
  return { text: "활성", color: "bg-green-400" };
}

function formatDt(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

interface NoticeTableProps {
  notices: Notice[];
  onEdit: (n: Notice) => void;
  onDelete: (id: number) => void;
}

export function NoticeTable({ notices, onEdit, onDelete }: NoticeTableProps) {
  if (notices.length === 0) {
    return (
      <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
          <Bell className="h-10 w-10 text-slate-200" strokeWidth={1.5} />
          <p className="text-[14px]">등록된 공지가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-[#ebeef0] text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-5 py-3.5">제목</th>
            <th className="px-5 py-3.5 whitespace-nowrap">시작</th>
            <th className="px-5 py-3.5 whitespace-nowrap">종료</th>
            <th className="px-5 py-3.5">상태</th>
            <th className="px-5 py-3.5" />
          </tr>
        </thead>
        <tbody>
          {notices.map((n, i) => {
            const st = statusLabel(n.startsAt, n.endsAt);
            const editable = st.text !== "만료";
            return (
              <tr
                key={n.id}
                className={[
                  "transition-colors hover:bg-slate-50",
                  i !== notices.length - 1 ? "border-b border-[#ebeef0]" : "",
                ].join(" ")}
              >
                <td className="px-5 py-4 font-medium text-slate-800">{n.title}</td>
                <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{formatDt(n.startsAt)}</td>
                <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{formatDt(n.endsAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${st.color}`} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {editable && (
                      <button
                        onClick={() => onEdit(n)}
                        className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(n.id)}
                      className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
