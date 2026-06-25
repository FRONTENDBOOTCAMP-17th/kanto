"use client";

import { HeaderPreview } from "./HeaderPreview";

interface NoticeFormProps {
  editingId: number | null;
  title: string;
  startsAt: string;
  endsAt: string;
  onTitleChange: (v: string) => void;
  onStartsAtChange: (v: string) => void;
  onEndsAtChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function NoticeForm({
  editingId,
  title,
  startsAt,
  endsAt,
  onTitleChange,
  onStartsAtChange,
  onEndsAtChange,
  onSubmit,
  onCancel,
}: NoticeFormProps) {
  const endsAtInvalid = !!startsAt && !!endsAt && endsAt <= startsAt;

  return (
    <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="mb-5 text-[15px] font-semibold text-slate-800">
        {editingId !== null ? "공지 수정" : "새 공지 등록"}
      </p>
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-600">공지 제목</label>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="공지 제목을 입력하세요"
            className="w-full rounded-xl border border-[#ebeef0] px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-600">시작 일시</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => onStartsAtChange(e.target.value)}
            className="w-full rounded-xl border border-[#ebeef0] px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-600">종료 일시</label>
          <input
            type="datetime-local"
            value={endsAt}
            min={startsAt || undefined}
            onChange={(e) => onEndsAtChange(e.target.value)}
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

        <HeaderPreview noticeTitle={title} />

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="rounded-xl border border-[#ebeef0] px-4 py-2 text-[13.5px] font-medium text-slate-500 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={!title.trim() || !startsAt || !endsAt || endsAtInvalid}
            className="rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
          >
            {editingId !== null ? "수정" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
