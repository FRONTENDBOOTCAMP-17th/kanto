"use client";

import { useMemo, useState, useTransition } from "react";
import { FileText } from "lucide-react";
import {
  AdminPost,
  POST_TYPE_LABEL,
} from "@/services/admin/adminPosts";
import AdminPostsTable from "./AdminPostsTable";
import PostDetailDrawer from "./PostDetailDrawer";
import {
  bulkTogglePostStatus,
  bulkDeletePosts,
} from "@/app/(admin)/admin/posts/_actions/bulkPostActions";
import { ConfirmModal } from "@/components/common/ConfirmModal";

interface AdminPostsClientProps {
  posts: AdminPost[];
}

const PAGE_SIZE = 20;

const CATEGORY_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "used_goods", label: POST_TYPE_LABEL.used_goods },
  { value: "jobs", label: POST_TYPE_LABEL.jobs },
  { value: "rental", label: POST_TYPE_LABEL.rental },
  { value: "community", label: POST_TYPE_LABEL.community },
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "active", label: "활성" },
  { value: "inactive", label: "비공개" },
] as const;

function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "whitespace-nowrap rounded-lg px-[15px] py-2 text-[13.5px] font-semibold",
        active
          ? "bg-white text-teal-600 shadow-sm"
          : "bg-transparent text-slate-500",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function AdminPostsClient({ posts }: AdminPostsClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(posts);
  const [selId, setSelId] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as never as { _t: number })._t);
    (showToast as never as { _t: number })._t = window.setTimeout(() => setToast(""), 2600);
  }

  function setFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  const totalCount = items.length;
  const activeCount = items.filter((p) => p.status === "active").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((post) => {
      if (status !== "all" && post.status !== status) return false;
      if (category !== "all" && post.post_type !== category) return false;
      if (q)
        return (
          post.title.toLowerCase().includes(q) ||
          (post.author_name?.toLowerCase().includes(q) ?? false)
        );
      return true;
    });
  }, [items, search, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const startIdx = (curPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const sel = selId != null ? (items.find((p) => p.id === selId) ?? null) : null;

  function patchPost(postId: number, patch: Partial<AdminPost>) {
    setItems((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
  }

  const pageIds = pageItems.map((p) => p.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const selectedCount = selectedIds.size;

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pageIds.every((id) => next.has(id))) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function handleBulkToggle() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await bulkTogglePostStatus(ids);
        setItems((prev) =>
          prev.map((p) =>
            selectedIds.has(p.id)
              ? { ...p, status: p.status === "active" ? "inactive" : "active" }
              : p,
          ),
        );
        setSelectedIds(new Set());
        showToast(`${ids.length}개 게시글의 상태를 변경했습니다`);
      } catch {
        showToast("상태 변경 실패 — 다시 시도해주세요");
      }
    });
  }

  function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await bulkDeletePosts(ids);
        setItems((prev) => prev.filter((p) => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
        setConfirmBulkDelete(false);
        showToast(`${ids.length}개 게시글을 삭제했습니다`);
      } catch {
        showToast("삭제 실패 — 다시 시도해주세요");
      }
    });
  }

  return (
    <>
      <style>{`
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="whitespace-nowrap text-[31px] font-extrabold tracking-tight text-slate-900">
              글 관리
            </h1>
          </div>
          <p className="mt-2 text-[15px] text-slate-500">
            게시글 노출 상태와 카테고리별 현황을 빠르게 확인하고 관리합니다
          </p>
        </div>
        <div className="whitespace-nowrap rounded-[11px] border border-[#e7ebee] bg-white px-[14px] py-[9px] text-[13px] font-medium text-slate-500">
          총 <span className="font-bold text-slate-900">{totalCount}</span>건 ·{" "}
          <span className="font-bold text-teal-600">{activeCount}</span>건 활성
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-[14px] border border-[#e7ebee] bg-white px-4 py-[13px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={(e) => setFilter(() => setSearch(e.target.value))}
          placeholder="제목 또는 작성자로 검색..."
          className="flex-1 border-none bg-transparent text-[14px] text-slate-900 outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-7 rounded-2xl border border-[#e7ebee] bg-white px-[22px] py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div>
          <div className="mb-2.5 text-[13px] font-bold text-slate-600">
            카테고리
          </div>
          <div className="inline-flex gap-1 rounded-[11px] bg-slate-100 p-1">
            {CATEGORY_OPTIONS.map((cat) => (
              <SegButton
                key={cat.value}
                active={category === cat.value}
                onClick={() => setFilter(() => setCategory(cat.value))}
              >
                {cat.label}
              </SegButton>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2.5 text-[13px] font-bold text-slate-600">
            노출 상태
          </div>
          <div className="inline-flex gap-1 rounded-[11px] bg-slate-100 p-1">
            {STATUS_OPTIONS.map((s) => (
              <SegButton
                key={s.value}
                active={status === s.value}
                onClick={() => setFilter(() => setStatus(s.value))}
              >
                {s.label}
              </SegButton>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#e7ebee] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <span className="text-[13px] text-slate-500">
          {selectedCount > 0 ? (
            <>
              <span className="font-bold text-slate-900">{selectedCount}개</span> 선택됨
            </>
          ) : (
            "일괄 처리할 게시글을 선택하세요"
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkToggle}
            disabled={selectedCount === 0 || isPending}
            className="cursor-pointer whitespace-nowrap rounded-[9px] border border-[#e2e8eb] bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            수정
          </button>
          <button
            onClick={() => setConfirmBulkDelete(true)}
            disabled={selectedCount === 0 || isPending}
            className="cursor-pointer whitespace-nowrap rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2 text-[13px] font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#e7ebee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="overflow-x-auto">
          <AdminPostsTable
            posts={pageItems}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            allSelected={allSelected}
            onOpen={(id) => setSelId(id)}
          />
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <FileText className="h-12 w-12 text-slate-200" strokeWidth={1.8} />
            <div className="mt-4 text-[15px] font-bold text-slate-500">
              조건에 맞는 게시글이 없습니다
            </div>
            <div className="mt-[5px] text-[13.5px] text-slate-400">
              필터를 변경하거나 검색어를 지워보세요
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f4f6] px-[22px] py-4">
            <span className="text-[13px] text-slate-400">
              총{" "}
              <span className="font-semibold text-slate-600">
                {filtered.length}
              </span>
              건 중{" "}
              <span className="font-semibold text-slate-600">
                {filtered.length === 0
                  ? "0"
                  : `${startIdx + 1}–${startIdx + pageItems.length}`}
              </span>{" "}
              표시
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-[34px] rounded-[9px] border border-[#e7ebee] bg-white px-[13px] text-[13px] font-semibold"
                style={{ color: curPage <= 1 ? "#cbd5e1" : "#475569" }}
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={[
                    "h-[34px] min-w-[34px] rounded-[9px] px-2 text-[13px]",
                    n === curPage
                      ? "border-none bg-teal-500 font-bold text-white"
                      : "border border-[#e7ebee] bg-white font-semibold text-slate-600",
                  ].join(" ")}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-[34px] rounded-[9px] border border-[#e7ebee] bg-white px-[13px] text-[13px] font-semibold"
                style={{ color: curPage >= totalPages ? "#cbd5e1" : "#475569" }}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {sel && (
        <PostDetailDrawer
          key={sel.id}
          post={sel}
          onClose={() => setSelId(null)}
          onChanged={patchPost}
          onDeleted={(id) => setItems((prev) => prev.filter((p) => p.id !== id))}
          onToast={showToast}
        />
      )}

      <ConfirmModal
        isOpen={confirmBulkDelete}
        title={`선택한 ${selectedCount}개 게시글을 삭제하시겠습니까?`}
        description="삭제된 게시글은 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      {toast && (
        <div
          className="fixed bottom-7 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-slate-900 px-5 py-[13px] text-white shadow-[0_10px_30px_rgba(15,23,42,0.3)]"
          style={{ animation: "fadeIn .18s ease" }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34d399"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-[13.5px] font-semibold">{toast}</span>
        </div>
      )}
    </>
  );
}
