"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Search, FileText, Loader2 } from "lucide-react";
import type { Scope, AffectedPost } from "@/services/admin/adminContent";
import { POST_TYPE_LABEL } from "@/services/admin/adminPosts";
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

  // 부모에서 key={editingId ?? "new"}로 마운트되므로
  // initialScopes/initialWords는 항상 올바른 초기값입니다.
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

  const searchMutation = useMutation({
    mutationFn: async (words: string[]) => {
      const params = new URLSearchParams({ words: words.join(",") });
      const res = await fetch(`/api/admin/profanity-rules/search-posts?${params}`);
      if (!res.ok) throw new Error();
      return res.json() as Promise<AffectedPost[]>;
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

  const affectedPosts = searchMutation.data ?? [];
  const searched = searchMutation.isSuccess || searchMutation.isPending;

  return (
    <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="mb-5 text-[15px] font-semibold text-slate-800">
        {editingId !== null ? "금칙어 룰 수정" : "새 금칙어 룰 등록"}
      </p>
      <div className="flex flex-col gap-5">
        {/* 적용 범위 */}
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

        {/* 금칙어 목록 */}
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

        {/* 영향받는 기존 게시물 */}
        <div className="border-t border-[#ebeef0] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-slate-800">영향받는 기존 게시물</p>
              <p className="mt-0.5 text-[12px] text-slate-400">
                등록한 금칙어가 포함된 기존 게시물을 검색합니다.
              </p>
            </div>
            <button
              onClick={() => searchMutation.mutate(words)}
              disabled={words.length === 0 || searchMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl border border-[#ebeef0] px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Search className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              검색
            </button>
          </div>
          {!searched ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-300">
              <FileText className="h-9 w-9" strokeWidth={1.5} />
              <p className="text-[13.5px]">금칙어를 입력하고 검색을 눌러 확인하세요.</p>
            </div>
          ) : searchMutation.isPending ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
              <span className="text-[14px]">검색 중...</span>
            </div>
          ) : affectedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-300">
              <FileText className="h-9 w-9" strokeWidth={1.5} />
              <p className="text-[13.5px]">영향받는 기존 게시물이 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="mb-2 text-[12.5px] text-slate-400">
                총 {affectedPosts.length}개 게시물이 해당 금칙어를 포함하고 있습니다.
              </p>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#ebeef0] text-left text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-4">제목</th>
                    <th className="pb-2 pr-4 whitespace-nowrap">유형</th>
                    <th className="pb-2 pr-4 whitespace-nowrap">일치 위치</th>
                    <th className="pb-2 whitespace-nowrap">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef0]">
                  {affectedPosts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 pr-4">
                        <span className="line-clamp-1 text-slate-700">{p.title}</span>
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-slate-500">
                        {POST_TYPE_LABEL[p.post_type] ?? p.post_type}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${
                            p.matched_in === "title"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {p.matched_in === "title" ? "제목" : "본문"}
                        </span>
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${
                            p.status === "active"
                              ? "bg-green-50 text-green-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.status === "active" ? "활성" : "비활성"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 취소 / 등록 버튼 */}
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
