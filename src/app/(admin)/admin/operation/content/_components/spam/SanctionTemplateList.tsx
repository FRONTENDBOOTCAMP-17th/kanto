"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, X, Check, Loader2 } from "lucide-react";
import type { SanctionTemplate, SanctionTrigger } from "@/services/admin/adminContent";

const TRIGGER_LABELS: Record<SanctionTrigger, string> = {
  profanity: "금칙어 위반",
  spam: "스팸 감지",
  report: "신고 누적",
};

export default function SanctionTemplateList() {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<SanctionTemplate[]>({
    queryKey: ["sanction-templates"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sanction-templates");
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, title, body }: { id: number; title: string; body: string }) => {
      const res = await fetch(`/api/admin/sanction-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json() as Promise<SanctionTemplate>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<SanctionTemplate[]>(["sanction-templates"], (prev = []) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
      setEditingId(null);
    },
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  function openEdit(t: SanctionTemplate) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditBody(t.body);
  }

  return (
    <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="border-b border-[#ebeef0] px-6 py-4">
        <p className="text-[15px] font-semibold text-slate-800">제재 알림 템플릿</p>
        <p className="mt-0.5 text-[12.5px] text-slate-400">
          자동 제재 시 사용자에게 발송되는 알림 메시지를 설정합니다.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
          <span className="text-[14px]">불러오는 중...</span>
        </div>
      ) : (
        <div className="divide-y divide-[#ebeef0]">
          {templates.map((t) => {
            const isEditing = editingId === t.id;
            return (
              <div key={t.id} className="px-6 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-semibold text-slate-600">
                    {TRIGGER_LABELS[t.trigger]}
                  </span>
                  {!isEditing ? (
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2} />
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          saveMutation.mutate({ id: t.id, title: editTitle, body: editBody })
                        }
                        disabled={saveMutation.isPending}
                        className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500 disabled:opacity-40"
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                        ) : (
                          <Check className="h-4 w-4" strokeWidth={2} />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400"
                      >
                        <X className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="제목"
                      className="w-full rounded-xl border border-[#ebeef0] px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      placeholder="메시지 내용"
                      className="w-full resize-none rounded-xl border border-[#ebeef0] px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-[14px] font-medium text-slate-800">{t.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{t.body}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
