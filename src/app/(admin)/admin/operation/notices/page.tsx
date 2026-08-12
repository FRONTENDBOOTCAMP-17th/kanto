"use client";

import { Bell, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { NoticeTable } from "./_components/NoticeTable";
import { NoticeForm } from "./_components/NoticeForm";
import { useNotices } from "@/hooks/admin/useNotices";

export default function NoticesPage() {
  const {
    notices,
    loading,
    tab,
    setTab,
    editingId,
    title,
    startsAt,
    endsAt,
    setTitle,
    setStartsAt,
    setEndsAt,
    openCreate,
    openEdit,
    handleSubmit,
    handleDelete,
    handleCancel,
  } = useNotices();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7">
        <Link
          href="/admin/operation"
          className="mb-2 flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600 active:scale-100"
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
