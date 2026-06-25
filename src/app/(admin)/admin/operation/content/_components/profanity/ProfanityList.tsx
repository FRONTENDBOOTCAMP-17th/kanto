"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Pencil, Trash2, Loader2 } from "lucide-react";
import type { ProfanityRule } from "@/services/admin/adminContent";
import { SCOPE_OPTIONS } from "./constants";

type Props = {
  onEdit: (rule: ProfanityRule) => void;
};

export default function ProfanityList({ onEdit }: Props) {
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery<ProfanityRule[]>({
    queryKey: ["profanity-rules"],
    queryFn: async () => {
      const res = await fetch("/api/admin/profanity-rules");
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/profanity-rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profanity-rules"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-400 rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
        <span className="text-[14px]">불러오는 중...</span>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400 rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <ShieldAlert className="h-10 w-10 text-slate-200" strokeWidth={1.5} />
        <p className="text-[14px]">등록된 금칙어 룰이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-[#ebeef0] text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-5 py-3.5">범위</th>
            <th className="px-5 py-3.5">금칙어</th>
            <th className="px-5 py-3.5 whitespace-nowrap">수정일</th>
            <th className="px-5 py-3.5" />
          </tr>
        </thead>
        <tbody>
          {rules.map((r, i) => (
            <tr
              key={r.id}
              className={[
                "transition-colors hover:bg-slate-50",
                i !== rules.length - 1 ? "border-b border-[#ebeef0]" : "",
              ].join(" ")}
            >
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1">
                  {r.scopes.map((s) => {
                    const ss = SCOPE_OPTIONS.find((o) => o.key === s)!;
                    return (
                      <span
                        key={s}
                        className={`rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${ss.style}`}
                      >
                        {ss.label}
                      </span>
                    );
                  })}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {r.words.slice(0, 6).map((w) => (
                    <span
                      key={w}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[12.5px] text-slate-600"
                    >
                      {w}
                    </span>
                  ))}
                  {r.words.length > 6 && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[12.5px] text-slate-400">
                      +{r.words.length - 6}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                {r.updated_at.slice(0, 10)}
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(r)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(r.id)}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
