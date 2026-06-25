"use client";

import { useState } from "react";
import { Wrench, Plus, Trash2, X, ChevronLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

type Window = {
  id: number;
  startsAt: string;
  endsAt: string;
  blockedPages: string[];
};

const PAGE_OPTIONS = [
  { key: "all", label: "전체" },
  { key: "write", label: "글쓰기" },
  { key: "chat", label: "채팅" },
  { key: "community", label: "커뮤니티" },
];

const MOCK_WINDOWS: Window[] = [
  {
    id: 1,
    startsAt: "2026-07-01T02:00",
    endsAt: "2026-07-01T04:00",
    blockedPages: ["all"],
  },
];

function windowStatus(startsAt: string, endsAt: string) {
  const now = new Date();
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (now < start) return { text: "예정", fg: "text-blue-600", bg: "bg-blue-50" };
  if (now > end) return { text: "완료", fg: "text-slate-400", bg: "bg-slate-100" };
  return { text: "점검 중", fg: "text-red-600", bg: "bg-red-50" };
}

function formatDt(iso: string) {
  return iso.replace("T", " ");
}

export default function MaintenancePage() {
  const [windows, setWindows] = useState<Window[]>(MOCK_WINDOWS);
  const [showForm, setShowForm] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [blockedPages, setBlockedPages] = useState<string[]>([]);

  const activeNow = windows.find((w) => {
    const now = new Date();
    return now >= new Date(w.startsAt) && now <= new Date(w.endsAt);
  });

  function togglePage(key: string) {
    if (key === "all") {
      setBlockedPages(blockedPages.includes("all") ? [] : ["all"]);
      return;
    }
    setBlockedPages((prev) => {
      const next = prev.filter((k) => k !== "all");
      return next.includes(key) ? next.filter((k) => k !== key) : [...next, key];
    });
  }

  function handleAdd() {
    if (!startsAt || !endsAt || blockedPages.length === 0) return;
    setWindows((prev) => [
      ...prev,
      { id: Date.now(), startsAt, endsAt, blockedPages },
    ]);
    setStartsAt("");
    setEndsAt("");
    setBlockedPages([]);
    setShowForm(false);
  }

  function handleDelete(id: number) {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/operation"
            className="mb-2 flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            운영 관리
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <Wrench className="h-5 w-5 text-teal-600" strokeWidth={2} />
            </div>
            <h1 className="text-[24px] font-bold text-slate-900">점검 설정</h1>
          </div>
          <p className="mt-1 text-[13px] text-slate-500">서비스 점검 일정을 등록하고 차단 범위를 설정합니다.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-teal-600"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          점검 일정 추가
        </button>
      </div>

      {/* Active status banner */}
      {activeNow ? (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" strokeWidth={2} />
          <div>
            <p className="text-[14px] font-semibold text-red-700">현재 점검 중입니다</p>
            <p className="text-[12.5px] text-red-500">
              {formatDt(activeNow.startsAt)} ~ {formatDt(activeNow.endsAt)} ·{" "}
              {activeNow.blockedPages.includes("all")
                ? "전체 차단"
                : activeNow.blockedPages.map((k) => PAGE_OPTIONS.find((o) => o.key === k)?.label).join(", ")}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#ebeef0] bg-white px-5 py-4 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
          <div className="h-2.5 w-2.5 rounded-full bg-teal-400" />
          <p className="text-[13.5px] font-medium text-slate-600">현재 점검 없음 — 서비스가 정상 운영 중입니다.</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-5 rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[15px] font-semibold text-slate-800">점검 일정 추가</span>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4.5 w-4.5" strokeWidth={2} />
            </button>
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <label className="mb-1.5 block text-[13px] font-medium text-slate-600">점검 시작</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full rounded-xl border border-[#ebeef0] px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div className="flex-1 min-w-48">
                <label className="mb-1.5 block text-[13px] font-medium text-slate-600">점검 종료</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full rounded-xl border border-[#ebeef0] px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-medium text-slate-600">차단 범위</label>
              <div className="flex flex-wrap gap-2">
                {PAGE_OPTIONS.map((opt) => {
                  const checked = blockedPages.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => togglePage(opt.key)}
                      className={[
                        "rounded-xl border px-4 py-2 text-[13px] font-medium transition-colors",
                        checked
                          ? "border-teal-400 bg-teal-50 text-teal-700"
                          : "border-[#ebeef0] text-slate-500 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-[#ebeef0] px-4 py-2 text-[13.5px] font-medium text-slate-500 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={handleAdd}
                disabled={!startsAt || !endsAt || blockedPages.length === 0}
                className="rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {windows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
            <Wrench className="h-10 w-10 text-slate-200" strokeWidth={1.5} />
            <p className="text-[14px]">등록된 점검 일정이 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-[#ebeef0] text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3.5 whitespace-nowrap">점검 시작</th>
                <th className="px-5 py-3.5 whitespace-nowrap">점검 종료</th>
                <th className="px-5 py-3.5">차단 범위</th>
                <th className="px-5 py-3.5">상태</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {windows.map((w, i) => {
                const st = windowStatus(w.startsAt, w.endsAt);
                const pageLabel = w.blockedPages.includes("all")
                  ? "전체"
                  : w.blockedPages
                      .map((k) => PAGE_OPTIONS.find((o) => o.key === k)?.label ?? k)
                      .join(", ");
                return (
                  <tr
                    key={w.id}
                    className={[
                      "transition-colors hover:bg-slate-50",
                      i !== windows.length - 1 ? "border-b border-[#ebeef0]" : "",
                    ].join(" ")}
                  >
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{formatDt(w.startsAt)}</td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{formatDt(w.endsAt)}</td>
                    <td className="px-5 py-4 text-slate-500">{pageLabel}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${st.fg} ${st.bg}`}>
                        {st.text}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
