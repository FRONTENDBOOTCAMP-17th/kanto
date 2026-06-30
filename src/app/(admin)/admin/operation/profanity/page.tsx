"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ChevronLeft,
  Trash2,
  Pencil,
  X,
  Search,
  FileText,
} from "lucide-react";

type Scope = "chat" | "post" | "nickname";

type ProfanityRule = {
  id: number;
  scopes: Scope[];
  words: string[];
  updatedAt: string;
};

const SCOPE_OPTIONS: { key: Scope; label: string; style: string }[] = [
  { key: "chat", label: "채팅", style: "border-blue-200 bg-blue-50 text-blue-600" },
  { key: "post", label: "게시글", style: "border-amber-200 bg-amber-50 text-amber-600" },
  { key: "nickname", label: "닉네임", style: "border-purple-200 bg-purple-50 text-purple-600" },
];

const MOCK_RULES: ProfanityRule[] = [
  { id: 1, scopes: ["chat", "post"], words: ["욕설A", "욕설B", "스팸단어", "도배어"], updatedAt: "2026-06-01" },
  { id: 2, scopes: ["post"], words: ["광고문구", "도박사이트"], updatedAt: "2026-06-10" },
  { id: 3, scopes: ["nickname"], words: ["금지닉네임"], updatedAt: "2026-06-15" },
];

type Tab = "list" | "create";

export default function ProfanityPage() {
  const [rules, setRules] = useState<ProfanityRule[]>(MOCK_RULES);
  const [tab, setTab] = useState<Tab>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [wordInput, setWordInput] = useState("");
  const [searched, setSearched] = useState(false);

  function addWord(raw: string) {
    const word = raw.trim().replace(/,$/, "");
    if (word && !words.includes(word)) {
      setWords((prev) => [...prev, word]);
    }
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

  function removeWord(w: string) {
    setWords((prev) => prev.filter((x) => x !== w));
  }

  function toggleScope(key: Scope) {
    setScopes((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  }

  function resetForm() {
    setEditingId(null);
    setScopes([]);
    setWords([]);
    setWordInput("");
    setSearched(false);
  }

  function openCreate() {
    resetForm();
    setTab("create");
  }

  function openEdit(rule: ProfanityRule) {
    setEditingId(rule.id);
    setScopes([...rule.scopes]);
    setWords([...rule.words]);
    setWordInput("");
    setSearched(false);
    setTab("create");
  }

  function handleSubmit() {
    if (scopes.length === 0 || words.length === 0) return;
    const now = new Date().toISOString().slice(0, 10);
    if (editingId !== null) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingId ? { ...r, scopes, words, updatedAt: now } : r,
        ),
      );
    } else {
      setRules((prev) => [{ id: Date.now(), scopes, words, updatedAt: now }, ...prev]);
    }
    resetForm();
    setTab("list");
  }

  function handleCancel() {
    resetForm();
    setTab("list");
  }

  function handleDelete(id: number) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="p-6 lg:p-8">
      
      <div className="mb-7">
        <Link
          href="/admin/operation"
          className="mb-2 flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          운영 관리
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
            <ShieldAlert className="h-5 w-5 text-teal-600" strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold text-slate-900">금칙어 관리</h1>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">
          채팅·게시글·닉네임에 적용할 금칙어 룰을 등록하고 관리합니다.
        </p>
      </div>

      
      <div className="mb-4">
        <div className="flex w-fit gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
          <button
            onClick={() => { setTab("list"); resetForm(); }}
            className={[
              "rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
              tab === "list"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            룰 목록
          </button>
          <button
            onClick={openCreate}
            className={[
              "rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
              tab === "create"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            룰 등록
          </button>
        </div>
      </div>

      
      {tab === "list" ? (
        <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <ShieldAlert className="h-10 w-10 text-slate-200" strokeWidth={1.5} />
              <p className="text-[14px]">등록된 금칙어 룰이 없습니다.</p>
            </div>
          ) : (
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
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500">{r.updatedAt}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(r)}
                            className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
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
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          
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
                        onClick={() => removeWord(w)}
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
                    onBlur={() => { if (wordInput.trim()) addWord(wordInput); }}
                    placeholder={words.length === 0 ? "예: 욕설, 스팸단어..." : ""}
                    className="min-w-24 flex-1 border-none bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-300"
                  />
                </div>
                {words.length > 0 && (
                  <p className="mt-1 text-[12px] text-slate-400">{words.length}개 등록됨</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={handleCancel}
                  className="rounded-xl border border-[#ebeef0] px-4 py-2 text-[13.5px] font-medium text-slate-500 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={scopes.length === 0 || words.length === 0}
                  className="rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
                >
                  {editingId !== null ? "수정" : "등록"}
                </button>
              </div>
            </div>
          </div>

          
          <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-slate-800">영향받는 기존 게시물</p>
                <p className="mt-0.5 text-[12.5px] text-slate-400">
                  등록한 금칙어가 포함된 기존 게시물을 검색합니다.
                </p>
              </div>
              <button
                onClick={() => setSearched(true)}
                disabled={words.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-[#ebeef0] px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <Search className="h-3.5 w-3.5" strokeWidth={2} />
                검색
              </button>
            </div>
            {!searched ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-300">
                <FileText className="h-9 w-9" strokeWidth={1.5} />
                <p className="text-[13.5px]">금칙어를 입력하고 검색을 눌러 확인하세요.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-300">
                <FileText className="h-9 w-9" strokeWidth={1.5} />
                <p className="text-[13.5px]">영향받는 기존 게시물이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
