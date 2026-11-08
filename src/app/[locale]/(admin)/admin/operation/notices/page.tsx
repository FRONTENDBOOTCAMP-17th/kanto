"use client";

import { Bell } from "lucide-react";
import { NoticeTable } from "./_components/NoticeTable";
import { NoticeForm } from "./_components/NoticeForm";
import { useNoticeList } from "@/hooks/admin/useNoticeList";
import { useNoticeForm } from "@/hooks/admin/useNoticeForm";
import { OperationPageHeader } from "@/components/admin/OperationPageHeader";

export default function NoticesPage() {
  const { notices, loading, handleDelete } = useNoticeList();
  const {
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
    handleCancel,
    submitError,
  } = useNoticeForm();

  return (
    <div className="p-6 lg:p-8">
      <OperationPageHeader
        icon={Bell}
        title="공지 관리"
        description="전체 사용자에게 표시할 공지를 등록하고 관리합니다."
      />

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
          submitError={submitError}
        />
      )}
    </div>
  );
}
