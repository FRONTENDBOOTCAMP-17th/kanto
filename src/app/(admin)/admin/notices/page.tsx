"use client";

import { useState } from "react";
import {
  Bell,
  Trash2,
  Pencil,
  ChevronLeft,
  ShoppingBag,
  Briefcase,
  Home,
  MapPin,
  User,
  Globe,
  Menu,
  Megaphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Tab = "list" | "create";

type Notice = {
  id: number;
  title: string;
  startsAt: string;
  endsAt: string;
};

const MOCK_NOTICES: Notice[] = [
  { id: 1, title: "필리핀 독립기념일 서비스 이용 안내", startsAt: "2026-06-10T09:00", endsAt: "2026-06-12T23:59" },
  { id: 2, title: "앱 업데이트 안내 (v2.1.0)", startsAt: "2026-06-20T00:00", endsAt: "2026-06-21T23:59" },
];

const NAV_ITEMS = [
  { icon: ShoppingBag, label: "중고거래" },
  { icon: Briefcase, label: "구인구직" },
  { icon: Home, label: "부동산" },
  { icon: MapPin, label: "번개모임" },
];

function statusLabel(startsAt: string, endsAt: string) {
  const now = new Date();
  if (now < new Date(startsAt)) return { text: "예정", color: "bg-amber-400" };
  if (now > new Date(endsAt)) return { text: "만료", color: "bg-slate-300" };
  return { text: "활성", color: "bg-green-400" };
}

function formatDt(iso: string) {
  return iso.replace("T", " ");
}

function HeaderPreview({ noticeTitle }: { noticeTitle: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* Simulated header */}
      <div className="border-b border-gray-200 bg-white">
        {/* Top bar */}
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center shrink-0">
            <Image src="/kantoMobileLogo.png" alt="kanto" width={36} height={36} className="block md:hidden" />
            <Image src="/kantoLogo.png" alt="kanto" width={100} height={46} className="hidden md:block" />
          </div>
          <div className="flex items-center gap-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500">
              <Globe className="h-4 w-4" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500">
              <Bell className="h-4 w-4" />
            </div>
            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-teal-600 md:flex">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 md:hidden">
              <Menu className="h-4 w-4" />
            </div>
          </div>
        </div>
        {/* Nav bar — desktop only, hidden on mobile */}
        <div className="hidden items-center justify-center gap-1 border-t border-gray-100 px-4 py-1 md:flex">
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-gray-600"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Notice banner */}
      <div className="w-full bg-teal-500 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2.5">
          <Megaphone className="h-4 w-4 shrink-0 text-white/80" strokeWidth={2} />
          <p className="text-center text-[13px] font-medium text-white">
            {noticeTitle.trim() || (
              <span className="text-white/50">공지 제목이 여기에 표시됩니다</span>
            )}
          </p>
        </div>
      </div>

      {/* Page body placeholder */}
      <div className="px-5 py-6">
        <div className="mb-3 h-5 w-40 rounded-md bg-slate-100" />
        <div className="flex flex-col gap-2">
          <div className="h-3.5 w-full rounded-md bg-slate-100" />
          <div className="h-3.5 w-5/6 rounded-md bg-slate-100" />
          <div className="h-3.5 w-4/6 rounded-md bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>(MOCK_NOTICES);
  const [tab, setTab] = useState<Tab>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const endsAtInvalid = !!startsAt && !!endsAt && endsAt <= startsAt;

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setTab("create");
  }

  function openEdit(n: Notice) {
    setEditingId(n.id);
    setTitle(n.title);
    setStartsAt(n.startsAt);
    setEndsAt(n.endsAt);
    setTab("create");
  }

  function handleSubmit() {
    if (!title.trim() || !startsAt || !endsAt || endsAtInvalid) return;
    if (editingId !== null) {
      setNotices((prev) =>
        prev.map((n) => (n.id === editingId ? { ...n, title: title.trim(), startsAt, endsAt } : n)),
      );
    } else {
      setNotices((prev) => [{ id: Date.now(), title: title.trim(), startsAt, endsAt }, ...prev]);
    }
    setEditingId(null);
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setTab("list");
  }

  function handleDelete(id: number) {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }

  function handleCancel() {
    setEditingId(null);
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setTab("list");
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page header */}
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
            <Bell className="h-5 w-5 text-teal-600" strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold text-slate-900">공지 관리</h1>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">전체 사용자에게 표시할 공지를 등록하고 관리합니다.</p>
      </div>

      {/* Tab bar */}
      <div className="mb-4">
        <div className="flex gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1 w-fit">
          <button
            onClick={() => setTab("list")}
            className={[
              "rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
              tab === "list"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            공지 내역
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
            공지 등록
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === "list" ? (
        <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          {notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <Bell className="h-10 w-10 text-slate-200" strokeWidth={1.5} />
              <p className="text-[14px]">등록된 공지가 없습니다.</p>
            </div>
          ) : (
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
                              onClick={() => openEdit(n)}
                              className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-50 hover:text-teal-500"
                            >
                              <Pencil className="h-4 w-4" strokeWidth={2} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(n.id)}
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
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="mb-5 text-[15px] font-semibold text-slate-800">
            {editingId !== null ? "공지 수정" : "새 공지 등록"}
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">공지 제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="공지 제목을 입력하세요"
                className="w-full rounded-xl border border-[#ebeef0] px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">시작 일시</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-xl border border-[#ebeef0] px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600">종료 일시</label>
              <input
                type="datetime-local"
                value={endsAt}
                min={startsAt || undefined}
                onChange={(e) => setEndsAt(e.target.value)}
                className={[
                  "w-full rounded-xl border px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:ring-2",
                  endsAtInvalid
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-[#ebeef0] focus:border-teal-400 focus:ring-teal-100",
                ].join(" ")}
              />
              {endsAtInvalid && (
                <p className="mt-1.5 text-[12px] text-red-500">종료 일시는 시작 일시보다 이후여야 합니다.</p>
              )}
            </div>

            {/* Preview */}
            <HeaderPreview noticeTitle={title} />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleCancel}
                className="rounded-xl border border-[#ebeef0] px-4 py-2 text-[13.5px] font-medium text-slate-500 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || !startsAt || !endsAt || endsAtInvalid}
                className="rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
              >
                {editingId !== null ? "수정" : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
