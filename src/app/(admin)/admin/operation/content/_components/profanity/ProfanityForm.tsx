"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import type { Scope } from "@/services/admin/adminContent";
import { SCOPE_OPTIONS } from "./constants";

type Props = {
  editingId: number | null;
  initialScopes: Scope[];
  initialWords: string[];
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ProfanityForm({
  editingId,
  initialScopes,
  initialWords,
  onSuccess,
  onCancel,
}: Props) {
  const queryClient = useQueryClient();

  
  
  const [scopes, setScopes] = useState<Scope[]>(initialScopes);
  const [words, setWords] = useState<string[]>(initialWords);
  const [wordInput, setWordInput] = useState("");

  const submitMutation = useMutation({
    mutationFn: async (body: { scopes: Scope[]; words: string[] }) => {
      const url =
        editingId !== null
          ? `/api/admin/profanity-rules/${editingId}`
          : "/api/admin/profanity-rules";
      const res = await fetch(url, {
        method: editingId !== null ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profanity-rules"] });
      onSuccess();
    },
  });

  function toggleScope(key: Scope) {
    setScopes((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  }

  function addWord(raw: string) {
    const word = raw.trim().replace(/,$/, "");
    if (word && !words.includes(word)) setWords((prev) => [...prev, word]);
    setWordInput("");
  }

  function handleWordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addWord(wordInput);
    } else if (e.key === "Backspace" && wordInput === "") {
      setWords((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="mb-5 text-[15px] font-semibold text-slate-800">
        {editingId !== null ? "금칙어 룰 수정" : "새 금칙어 룰 등록"}
      </p>
      <div className="flex flex-col gap-5">
        
        <div>
          <label className="mb-2 block text-[13px] font-medium text-slate-600">
            적용 범위
            <span className="ml-1.5 font-normal text-slate-400">(복수 선택 가능)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleScope(opt.key)}
                className={[
                  "rounded-xl border px-4 py-2 text-[13px] font-medium transition-colors",
                  scopes.includes(opt.key)
                    ? "border-teal-400 bg-teal-50 text-teal-700"
                    : "border-[#ebeef0] text-slate-500 hover:bg-slate-50",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
            금칙어 목록
            <span className="ml-1.5 font-normal text-slate-400">
              (단어 입력 후 Enter 또는 쉼표로 추가)
            </span>
          </label>
          <div className="flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-xl border border-[#ebeef0] px-3 py-2.5 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
            {words.map((w) => (
              <span
                key={w}
                className="flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[13px] font-medium text-teal-700"
              >
                {w}
                <button
                  type="button"
                  onClick={() => setWords((prev) => prev.filter((x) => x !== w))}
                  className="ml-0.5 text-teal-400 hover:text-teal-600"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            ))}
            <input
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              onKeyDown={handleWordKeyDown}
              onBlur={() => {
                if (wordInput.trim()) addWord(wordInput);
              }}
              placeholder={words.length === 0 ? "예: 욕설, 스팸단어..." : ""}
              className="min-w-24 flex-1 border-none bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-300"
            />
          </div>
          {words.length > 0 && (
            <p className="mt-1 text-[12px] text-slate-400">{words.length}개 등록됨</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#ebeef0] pt-4">
          <button
            onClick={onCancel}
            className="rounded-xl border border-[#ebeef0] px-4 py-2 text-[13.5px] font-medium text-slate-500 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            onClick={() => submitMutation.mutate({ scopes, words })}
            disabled={scopes.length === 0 || words.length === 0 || submitMutation.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
          >
            {submitMutation.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
            )}
            {editingId !== null ? "수정" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
