"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ChevronLeft,
  ShieldAlert,
  Zap,
  Trash2,
  Pencil,
  X,
  Search,
  FileText,
  Check,
  Loader2,
} from "lucide-react";
import type { Scope, ProfanityRule, SpamConfig, SanctionTemplate, SanctionTrigger, AffectedPost } from "@/services/admin/adminContent";
import { POST_TYPE_LABEL } from "@/services/admin/adminPosts";

/* ─── 상수 ──────────────────────────────────────────────── */

type Section = "profanity" | "spam";
type ProfTab = "list" | "create";

const SCOPE_OPTIONS: { key: Scope; label: string; style: string }[] = [
  { key: "chat", label: "채팅", style: "border-blue-200 bg-blue-50 text-blue-600" },
  { key: "post", label: "게시글", style: "border-amber-200 bg-amber-50 text-amber-600" },
  { key: "nickname", label: "닉네임", style: "border-purple-200 bg-purple-50 text-purple-600" },
];

const TRIGGER_LABELS: Record<SanctionTrigger, string> = {
  profanity: "금칙어 위반",
  spam: "스팸 감지",
  report: "신고 누적",
};

const DEFAULT_SPAM_CONFIG: SpamConfig = {
  chat_window_sec: 3,
  chat_max_count: 5,
  chat_cooldown_sec: 10,
  max_urls_per_post: 3,
  profanity_strike_max: 3,
  report_strike_max: 5,
  auto_sanction_enabled: false,
  updated_at: "",
};

/* ─── 공용 컴포넌트 ─────────────────────────────────────── */

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
          className="w-24 rounded-xl border border-[#ebeef0] px-3 py-2 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
        {suffix && <span className="text-[13px] text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}

/* ─── 메인 페이지 ───────────────────────────────────────── */

export default function ContentPage() {
  const [section, setSection] = useState<Section>("profanity");

  /* 금칙어 상태 */
  const [rules, setRules] = useState<ProfanityRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [profTab, setProfTab] = useState<ProfTab>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [wordInput, setWordInput] = useState("");
  const [searched, setSearched] = useState(false);
  const [affectedPosts, setAffectedPosts] = useState<AffectedPost[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [profSaving, setProfSaving] = useState(false);

  /* 스팸 상태 */
  const [config, setConfig] = useState<SpamConfig>(DEFAULT_SPAM_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);
  const [spamSaving, setSpamSaving] = useState(false);
  const [spamSaved, setSpamSaved] = useState(false);
  const [templates, setTemplates] = useState<SanctionTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);

  /* ── 데이터 로드 ── */

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const res = await fetch("/api/admin/profanity-rules");
      if (!res.ok) throw new Error();
      setRules(await res.json());
    } finally {
      setRulesLoading(false);
    }
  }, []);

  const loadSpamConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await fetch("/api/admin/spam-config");
      if (!res.ok) throw new Error();
      setConfig(await res.json());
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch("/api/admin/sanction-templates");
      if (!res.ok) throw new Error();
      setTemplates(await res.json());
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);
  useEffect(() => { loadSpamConfig(); loadTemplates(); }, [loadSpamConfig, loadTemplates]);

  /* ── 금칙어 핸들러 ── */

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

  function resetProfForm() {
    setEditingId(null);
    setScopes([]);
    setWords([]);
    setWordInput("");
    setSearched(false);
    setAffectedPosts([]);
  }

  async function handleSearch() {
    if (words.length === 0) return;
    setSearchLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ words: words.join(",") });
      const res = await fetch(`/api/admin/profanity-rules/search-posts?${params}`);
      if (!res.ok) throw new Error();
      setAffectedPosts(await res.json());
    } finally {
      setSearchLoading(false);
    }
  }

  function openCreate() {
    resetProfForm();
    setProfTab("create");
  }

  function openEdit(rule: ProfanityRule) {
    setEditingId(rule.id);
    setScopes([...rule.scopes]);
    setWords([...rule.words]);
    setWordInput("");
    setSearched(false);
    setProfTab("create");
  }

  async function handleProfSubmit() {
    if (scopes.length === 0 || words.length === 0) return;
    setProfSaving(true);
    try {
      const url = editingId !== null
        ? `/api/admin/profanity-rules/${editingId}`
        : "/api/admin/profanity-rules";
      const method = editingId !== null ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopes, words }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await loadRules();
      resetProfForm();
      setProfTab("list");
    } finally {
      setProfSaving(false);
    }
  }

  async function handleProfDelete(id: number) {
    const res = await fetch(`/api/admin/profanity-rules/${id}`, { method: "DELETE" });
    if (res.ok) setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function handleProfCancel() {
    resetProfForm();
    setProfTab("list");
  }

  /* ── 스팸 핸들러 ── */

  function setSpamField<K extends keyof SpamConfig>(key: K, val: SpamConfig[K]) {
    setSpamSaved(false);
    setConfig((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSpamSave() {
    setSpamSaving(true);
    try {
      const res = await fetch("/api/admin/spam-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setConfig(await res.json());
      setSpamSaved(true);
    } finally {
      setSpamSaving(false);
    }
  }

  function openTemplateEdit(t: SanctionTemplate) {
    setEditingTemplateId(t.id);
    setEditTitle(t.title);
    setEditBody(t.body);
  }

  async function handleTemplateSave(id: number) {
    setTemplateSaving(true);
    try {
      const res = await fetch(`/api/admin/sanction-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, body: editBody }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: SanctionTemplate = await res.json();
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingTemplateId(null);
    } finally {
      setTemplateSaving(false);
    }
  }

  /* ── 렌더 ── */

  return (
    <div className="p-6 lg:p-8">
      {/* 페이지 헤더 */}
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
            <ShieldCheck className="h-5 w-5 text-teal-600" strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold text-slate-900">콘텐츠 관리</h1>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">
          금칙어 필터 룰과 스팸 감지 설정을 관리합니다.
        </p>
      </div>

      {/* 섹션 탭 */}
      <div className="mb-6">
        <div className="flex w-fit gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
          <button
            onClick={() => setSection("profanity")}
            className={[
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
              section === "profanity"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            <ShieldAlert className="h-4 w-4" strokeWidth={2} />
            금칙어 관리
          </button>
          <button
            onClick={() => setSection("spam")}
            className={[
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
              section === "spam"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            <Zap className="h-4 w-4" strokeWidth={2} />
            스팸 관리
          </button>
        </div>
      </div>

      {/* ══ 금칙어 관리 ══ */}
      {section === "profanity" && (
        <>
          <div className="mb-4">
            <div className="flex w-fit gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
              <button
                onClick={() => { setProfTab("list"); resetProfForm(); }}
                className={[
                  "rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
                  profTab === "list"
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
                  profTab === "create"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                ].join(" ")}
              >
                룰 등록
              </button>
            </div>
          </div>

          {profTab === "list" ? (
            <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              {rulesLoading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
                  <span className="text-[14px]">불러오는 중...</span>
                </div>
              ) : rules.length === 0 ? (
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
                              <span key={w} className="rounded-md bg-slate-100 px-2 py-0.5 text-[12.5px] text-slate-600">
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
                              onClick={() => openEdit(r)}
                              className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => handleProfDelete(r.id)}
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
                        <button type="button" onClick={() => setWords((prev) => prev.filter((x) => x !== w))} className="ml-0.5 text-teal-400 hover:text-teal-600">
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
                      onClick={handleSearch}
                      disabled={words.length === 0 || searchLoading}
                      className="flex items-center gap-1.5 rounded-xl border border-[#ebeef0] px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      {searchLoading
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                        : <Search className="h-3.5 w-3.5" strokeWidth={2} />
                      }
                      검색
                    </button>
                  </div>
                  {!searched ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-300">
                      <FileText className="h-9 w-9" strokeWidth={1.5} />
                      <p className="text-[13.5px]">금칙어를 입력하고 검색을 눌러 확인하세요.</p>
                    </div>
                  ) : searchLoading ? (
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
                      <p className="mb-2 text-[12.5px] text-slate-400">총 {affectedPosts.length}개 게시물이 해당 금칙어를 포함하고 있습니다.</p>
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
                                <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${p.matched_in === "title" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                                  {p.matched_in === "title" ? "제목" : "본문"}
                                </span>
                              </td>
                              <td className="py-2.5 whitespace-nowrap">
                                <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${p.status === "active" ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"}`}>
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
                    onClick={handleProfCancel}
                    className="rounded-xl border border-[#ebeef0] px-4 py-2 text-[13.5px] font-medium text-slate-500 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleProfSubmit}
                    disabled={scopes.length === 0 || words.length === 0 || profSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
                  >
                    {profSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />}
                    {editingId !== null ? "수정" : "등록"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ 스팸 관리 ══ */}
      {section === "spam" && (
        <div className="flex flex-col gap-5">
          {/* 감지 민감도 카드 */}
          <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="mb-5 text-[15px] font-semibold text-slate-800">감지 민감도 설정</p>

            {configLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
                <span className="text-[14px]">불러오는 중...</span>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">채팅 도배 감지</p>
                  <div className="flex flex-wrap gap-6">
                    <NumberField label="감지 윈도우" value={config.chat_window_sec} onChange={(v) => setSpamField("chat_window_sec", v)} suffix="초 내에" />
                    <NumberField label="최대 전송 수" value={config.chat_max_count} onChange={(v) => setSpamField("chat_max_count", v)} suffix="번 이상 시" />
                    <NumberField label="쿨다운" value={config.chat_cooldown_sec} onChange={(v) => setSpamField("chat_cooldown_sec", v)} suffix="초 차단" />
                  </div>
                </div>

                <div className="my-5 border-t border-[#ebeef0]" />

                <div className="mb-5">
                  <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">게시글 제한</p>
                  <NumberField label="포스트당 최대 URL 수" value={config.max_urls_per_post} onChange={(v) => setSpamField("max_urls_per_post", v)} suffix="개 초과 시 차단" />
                </div>

                <div className="my-5 border-t border-[#ebeef0]" />

                <div>
                  <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">자동 제재 기준</p>
                  <div className="mb-5 flex flex-wrap gap-6">
                    <NumberField label="금칙어 위반 누적" value={config.profanity_strike_max} onChange={(v) => setSpamField("profanity_strike_max", v)} suffix="회 초과 시 제재" />
                    <NumberField label="신고 누적" value={config.report_strike_max} onChange={(v) => setSpamField("report_strike_max", v)} suffix="회 초과 시 제재" />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#ebeef0] bg-slate-50 px-4 py-3.5">
                    <div>
                      <p className="text-[14px] font-medium text-slate-800">자동 제재 활성화</p>
                      <p className="mt-0.5 text-[12.5px] text-slate-400">기준 초과 시 자동으로 계정을 7일 정지합니다.</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.auto_sanction_enabled}
                      onClick={() => setSpamField("auto_sanction_enabled", !config.auto_sanction_enabled)}
                      className={[
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        config.auto_sanction_enabled ? "bg-teal-500" : "bg-slate-200",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          config.auto_sanction_enabled ? "translate-x-5" : "translate-x-0",
                        ].join(" ")}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  {spamSaved && (
                    <span className="flex items-center gap-1 text-[13px] text-teal-600">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      저장되었습니다
                    </span>
                  )}
                  <button
                    onClick={handleSpamSave}
                    disabled={spamSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
                  >
                    {spamSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />}
                    저장
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 제재 알림 템플릿 카드 */}
          <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="border-b border-[#ebeef0] px-6 py-4">
              <p className="text-[15px] font-semibold text-slate-800">제재 알림 템플릿</p>
              <p className="mt-0.5 text-[12.5px] text-slate-400">자동 제재 시 사용자에게 발송되는 알림 메시지를 설정합니다.</p>
            </div>

            {templatesLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} />
                <span className="text-[14px]">불러오는 중...</span>
              </div>
            ) : (
              <div className="divide-y divide-[#ebeef0]">
                {templates.map((t) => {
                  const isEditing = editingTemplateId === t.id;
                  return (
                    <div key={t.id} className="px-6 py-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-semibold text-slate-600">
                          {TRIGGER_LABELS[t.trigger]}
                        </span>
                        {!isEditing ? (
                          <button onClick={() => openTemplateEdit(t)} className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500">
                            <Pencil className="h-4 w-4" strokeWidth={2} />
                          </button>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleTemplateSave(t.id)}
                              disabled={templateSaving}
                              className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500 disabled:opacity-40"
                            >
                              {templateSaving
                                ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                                : <Check className="h-4 w-4" strokeWidth={2} />
                              }
                            </button>
                            <button onClick={() => setEditingTemplateId(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400">
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
        </div>
      )}
    </div>
  );
}
