"use client";

import { useState, useEffect } from "react";
import { Bell, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { NoticeTable } from "./_components/NoticeTable";
import { NoticeForm } from "./_components/NoticeForm";

export type Tab = "list" | "create";

export type Notice = {
  id: number;
  title: string;
  startsAt: string;
  endsAt: string;
};

function toNotice(row: { id: number; title: string; starts_at: string; ends_at: string }): Notice {
  return { id: row.id, title: row.title, startsAt: row.starts_at, endsAt: row.ends_at };
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("list");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  useEffect(() => {
    fetch("/api/admin/notices")
      .then((res) => res.json())
      .then((data) => setNotices(data.map(toNotice)))
      .finally(() => setLoading(false));
  }, []);

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

  async function handleSubmit() {
    const endsAtInvalid = !!startsAt && !!endsAt && endsAt <= startsAt;
    if (!title.trim() || !startsAt || !endsAt || endsAtInvalid) return;

    const body = {
      title: title.trim(),
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
    };

    if (editingId !== null) {
      const res = await fetch(`/api/admin/notices/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = toNotice(await res.json());
        setNotices((prev) => prev.map((n) => (n.id === editingId ? updated : n)));
      }
    } else {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const created = toNotice(await res.json());
        setNotices((prev) => [created, ...prev]);
      }
    }

    setEditingId(null);
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setTab("list");
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
    if (res.ok) setNotices((prev) => prev.filter((n) => n.id !== id));
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

      {tab === "list" ? (
        loading ? (
          <div className="flex justify-center py-20 text-slate-400 text-[14px]">불러오는 중...</div>
        ) : (
          <NoticeTable notices={notices} onEdit={openEdit} onDelete={handleDelete} />
        )
      ) : (
        <NoticeForm
          editingId={editingId}
          title={title}
          startsAt={startsAt}
          endsAt={endsAt}
          onTitleChange={setTitle}
          onStartsAtChange={setStartsAt}
          onEndsAtChange={setEndsAt}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
