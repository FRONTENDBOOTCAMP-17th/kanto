"use client";

import { useMemo, useState, useTransition } from "react";
import { Users } from "lucide-react";
import { User } from "@/services/admin/adminUsers";
import AdminUsersTable from "./AdminUsersTable";
import UserDetailDrawer from "./UserDetailDrawer";
import {
  bulkApplySanction,
  bulkDeleteUsers,
} from "@/app/(admin)/admin/users/_actions/bulkUserActions";
import { ConfirmModal } from "@/components/common/ConfirmModal";

interface AdminUsersClientProps {
  users: User[];
}

const PAGE_SIZE = 20;

const SANCTION_OPTIONS: { key: "7d" | "30d" | "perm"; label: string }[] = [
  { key: "7d", label: "7일 정지" },
  { key: "30d", label: "30일 정지" },
  { key: "perm", label: "영구 정지" },
];

export default function AdminUsersClient({ users }: AdminUsersClientProps) {
  const [items, setItems] = useState(users);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selId, setSelId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkSanctioning, setBulkSanctioning] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

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
  const reportedCount = items.filter((u) => u.pending_report_count > 0).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false),
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const startIdx = (curPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const sel = selId != null ? (items.find((u) => u.id === selId) ?? null) : null;

  function patchUser(userId: number, patch: Partial<User>) {
    setItems((prev) => prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)));
  }

  const pageIds = pageItems.map((u) => u.id);
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

  function bulkExpiresAt(type: "7d" | "30d" | "perm"): string {
    if (type === "perm") return "9999-12-31T23:59:59Z";
    const d = new Date();
    d.setDate(d.getDate() + (type === "7d" ? 7 : 30));
    return d.toISOString();
  }

  function handleBulkSanction(type: "7d" | "30d" | "perm") {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await bulkApplySanction(ids, type);
        const exp = bulkExpiresAt(type);
        setItems((prev) =>
          prev.map((u) =>
            selectedIds.has(u.id)
              ? { ...u, suspended_until: exp, pending_report_count: 0, pending_reports: [] }
              : u,
          ),
        );
        setSelectedIds(new Set());
        setBulkSanctioning(false);
        showToast(`${ids.length}명에게 제재를 부여했습니다`);
      } catch {
        showToast("제재 적용 실패 — 다시 시도해주세요");
      }
    });
  }

  function handleBulkDeleteUsers() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    startTransition(async () => {
      try {
        await bulkDeleteUsers(ids);
        setItems((prev) => prev.filter((u) => !selectedIds.has(u.id)));
        setSelectedIds(new Set());
        setConfirmBulkDelete(false);
        showToast(`${ids.length}명을 삭제했습니다`);
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
              유저 관리
            </h1>
          </div>
          <p className="mt-2 text-[15px] text-slate-500">
            가입 회원 현황을 확인하고 신고된 유저를 검토합니다
          </p>
        </div>
        <div className="whitespace-nowrap rounded-[11px] border border-[#e7ebee] bg-white px-[14px] py-[9px] text-[13px] font-medium text-slate-500">
          총 <span className="font-bold text-slate-900">{totalCount}</span>명 ·{" "}
          <span className="font-bold text-red-600">{reportedCount}</span>명 신고 있음
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-[14px] border border-[#e7ebee] bg-white px-4 py-[13px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={(e) => setFilter(() => setSearch(e.target.value))}
          placeholder="이름 또는 이메일로 검색..."
          className="flex-1 border-none bg-transparent text-[14px] text-slate-900 outline-none"
        />
      </div>

      <div className="rounded-[14px] border border-[#e7ebee] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-slate-500">
            {selectedCount > 0 ? (
              <>
                <span className="font-bold text-slate-900">{selectedCount}명</span> 선택됨
              </>
            ) : (
              "일괄 처리할 회원을 선택하세요"
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkSanctioning((v) => !v)}
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
        {bulkSanctioning && selectedCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#f1f4f6] pt-3">
            <span className="text-[12px] font-bold uppercase tracking-wide text-slate-400">
              제재 유형
            </span>
            {SANCTION_OPTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => handleBulkSanction(s.key)}
                disabled={isPending}
                className={[
                  "cursor-pointer whitespace-nowrap rounded-[9px] border px-3 py-[7px] text-[12.5px] font-bold disabled:opacity-40",
                  s.key === "perm"
                    ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
                ].join(" ")}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#e7ebee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="overflow-x-auto">
          <AdminUsersTable
            users={pageItems}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            allSelected={allSelected}
            onOpen={(id) => setSelId(id)}
          />
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Users className="h-12 w-12 text-slate-200" strokeWidth={1.8} />
            <div className="mt-4 text-[15px] font-bold text-slate-500">조건에 맞는 회원이 없습니다</div>
            <div className="mt-[5px] text-[13.5px] text-slate-400">검색어를 변경해 보세요</div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f4f6] px-[22px] py-4">
            <span className="text-[13px] text-slate-400">
              총 <span className="font-semibold text-slate-600">{filtered.length}</span>명 중{" "}
              <span className="font-semibold text-slate-600">
                {filtered.length === 0 ? "0" : `${startIdx + 1}–${startIdx + pageItems.length}`}
              </span>{" "}표시
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-[34px] rounded-[9px] border border-[#e7ebee] bg-white px-[13px] text-[13px] font-semibold" style={{ color: curPage <= 1 ? "#cbd5e1" : "#475569" }}>이전</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className={["h-[34px] min-w-[34px] rounded-[9px] px-2 text-[13px]", n === curPage ? "border-none bg-teal-500 font-bold text-white" : "border border-[#e7ebee] bg-white font-semibold text-slate-600"].join(" ")}>{n}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-[34px] rounded-[9px] border border-[#e7ebee] bg-white px-[13px] text-[13px] font-semibold" style={{ color: curPage >= totalPages ? "#cbd5e1" : "#475569" }}>다음</button>
            </div>
          </div>
        )}
      </div>

      {sel && (
        <UserDetailDrawer
          key={sel.id}
          user={sel}
          onClose={() => setSelId(null)}
          onChanged={patchUser}
          onToast={showToast}
        />
      )}

      <ConfirmModal
        isOpen={confirmBulkDelete}
        title={`선택한 ${selectedCount}명을 삭제하시겠습니까?`}
        description="삭제된 회원은 목록에서 제거됩니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleBulkDeleteUsers}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      {toast && (
        <div className="fixed bottom-7 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-slate-900 px-5 py-[13px] text-white shadow-[0_10px_30px_rgba(15,23,42,0.3)]" style={{ animation: "fadeIn .18s ease" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-[13.5px] font-semibold">{toast}</span>
        </div>
      )}
    </>
  );
}
