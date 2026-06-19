"use client";

import { useMemo, useState, useTransition } from "react";
import { Users, ExternalLink, X } from "lucide-react";
import { User, SanctionRecord } from "@/services/admin/adminUsers";
import AdminUsersTable from "./AdminUsersTable";
import { applySanction } from "@/app/(admin)/admin/users/_actions/applySanction";
import { liftSanction } from "@/app/(admin)/admin/users/_actions/liftSanction";

interface AdminUsersClientProps {
  users: User[];
}

const PAGE_SIZE = 20;

const SANCTION_OPTIONS: { key: "7d" | "30d" | "perm"; label: string }[] = [
  { key: "7d", label: "7일 정지" },
  { key: "30d", label: "30일 정지" },
  { key: "perm", label: "영구 정지" },
];

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(date));
}

function formatDateTime(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

export default function AdminUsersClient({ users }: AdminUsersClientProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selId, setSelId] = useState<number | null>(null);
  const [sanctioning, setSanctioning] = useState(false);
  const [pendingSanction, setPendingSanction] = useState<"7d" | "30d" | "perm">("7d");
  const [localSanctions, setLocalSanctions] = useState<Record<number, SanctionRecord[]>>({});
  const [localSuspended, setLocalSuspended] = useState<Record<number, string | null>>({});
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as never as { _t: number })._t);
    (showToast as never as { _t: number })._t = window.setTimeout(() => setToast(""), 2600);
  }

  function setFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  const totalCount = users.length;
  const reportedCount = users.filter((u) => u.report_count > 0).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false),
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const startIdx = (curPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const baseUser = selId != null ? (users.find((u) => u.id === selId) ?? null) : null;
  const sel = baseUser
    ? {
        ...baseUser,
        suspended_until: localSuspended[baseUser.id] !== undefined ? localSuspended[baseUser.id] : baseUser.suspended_until,
        sanctions: [...(localSanctions[baseUser.id] ?? []), ...baseUser.sanctions],
      }
    : null;

  const isPerm = sel?.suspended_until === "9999-12-31T23:59:59Z";
  const isSuspended =
    sel?.suspended_until != null &&
    (isPerm || new Date(sel.suspended_until) > new Date());

  function sanctionIsActive(s: SanctionRecord) {
    if (s.sanction_type === "perm") return true;
    if (!s.expires_at) return false;
    return new Date(s.expires_at) > new Date();
  }

  function closeDrawer() {
    setSelId(null);
    setSanctioning(false);
  }

  function handleApplySanction() {
    if (!sel) return;
    const userId = sel.id;
    startTransition(async () => {
      try {
        const record = await applySanction(userId, pendingSanction);
        setLocalSanctions((prev) => ({
          ...prev,
          [userId]: [record, ...(prev[userId] ?? [])],
        }));
        setLocalSuspended((prev) => ({ ...prev, [userId]: record.expires_at }));
        setSanctioning(false);
        showToast(`${sel.name}에게 ${record.label} 제재를 부여했습니다`);
      } catch {
        showToast("제재 적용 실패 — 다시 시도해주세요");
      }
    });
  }

  function handleLiftSanction() {
    if (!sel) return;
    const userId = sel.id;
    const userName = sel.name;
    startTransition(async () => {
      try {
        await liftSanction(userId);
        const liftRecord: SanctionRecord = {
          id: Date.now(),
          label: "제재 해제",
          sanction_type: "lifted",
          expires_at: null,
          created_at: new Date().toISOString(),
          admin_name: null,
        };
        setLocalSanctions((prev) => ({
          ...prev,
          [userId]: [liftRecord, ...(prev[userId] ?? [])],
        }));
        setLocalSuspended((prev) => ({ ...prev, [userId]: null }));
        showToast(`${userName}의 제재를 해제했습니다`);
      } catch {
        showToast("제재 해제 실패 — 다시 시도해주세요");
      }
    });
  }

  return (
    <>
      <style>{`
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Header */}
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

      {/* Search */}
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

      {/* Table */}
      <div className="overflow-hidden rounded-[18px] border border-[#e7ebee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="overflow-x-auto">
          <AdminUsersTable users={pageItems} onOpen={(id) => { setSelId(id); setSanctioning(false); }} />
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

      {/* Drawer */}
      {sel && (
        <>
          <div onClick={closeDrawer} className="fixed inset-0 z-[70] bg-slate-900/45" style={{ animation: "fadeIn .18s ease" }} />
          <div className="fixed right-0 top-0 z-[71] flex h-screen w-[460px] max-w-full flex-col bg-white shadow-[-12px_0_44px_rgba(15,23,42,0.18)]" style={{ animation: "drawerIn .26s cubic-bezier(.4,0,.2,1)" }}>

            {/* header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#f1f4f6] px-6 py-[22px]">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">유저 상세</h2>
                <span className="text-[12.5px] font-semibold text-slate-400">#{sel.id}</span>
              </div>
              <button onClick={closeDrawer} className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#eef1f3] bg-white text-slate-500 hover:bg-slate-100">
                <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-6">
              {/* status pills */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {isSuspended ? (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-1 text-[12px] font-bold" style={{ background: "#fef2f2", color: "#dc2626" }}>
                    {isPerm ? "영구 정지" : "정지 중"}
                  </span>
                ) : (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-1 text-[12px] font-bold" style={{ background: "#ecfdf5", color: "#059669" }}>
                    정상
                  </span>
                )}
                {sel.report_count > 0 && (
                  <span className="inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-1 text-[12px] font-semibold" style={{ background: "#fef2f2", color: "#dc2626" }}>
                    신고 {sel.report_count}건
                  </span>
                )}
              </div>

              {/* user info card */}
              <div className="mb-5 rounded-[14px] border border-[#eef1f3] bg-slate-50 p-[18px]">
                <div className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">
                  <Users className="h-[17px] w-[17px] text-teal-600" strokeWidth={2} />
                  회원
                </div>
                <div className="text-[15.5px] font-bold text-slate-900">{sel.name}</div>
                {sel.email && <div className="mt-1 text-[13.5px] text-slate-500">{sel.email}</div>}
                <a href={`/admin/users/${sel.id}`} target="_blank" rel="noreferrer" className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange-500">
                  상세 프로필 보기
                  <ExternalLink className="h-[14px] w-[14px]" strokeWidth={2.2} />
                </a>
              </div>

              {/* meta */}
              <div className="mb-5 overflow-hidden rounded-xl border border-[#eef1f3]">
                <div className="flex items-center justify-between border-b border-[#f3f5f7] px-4 py-[11px]">
                  <span className="text-[13px] text-slate-400">작성 글</span>
                  <span className="text-[13px] font-semibold text-slate-900">{(sel.post_count ?? 0).toLocaleString()}개</span>
                </div>
                <div className="flex items-center justify-between px-4 py-[11px]">
                  <span className="text-[13px] text-slate-400">가입일</span>
                  <span className="text-[13px] font-semibold text-slate-900">{formatDate(sel.created_at)}</span>
                </div>
              </div>

              {/* 제재 이력 로그 */}
              <div className="overflow-hidden rounded-[14px] border border-[#eef1f3]">
                <div className="flex items-center gap-2 border-b border-[#f1f4f6] bg-slate-50 px-4 py-[13px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isSuspended ? "#dc2626" : "#94a3b8"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  <span className="text-[13px] font-extrabold text-slate-900">제재 이력</span>
                  <span className="ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                    style={sel.sanctions.length === 0 ? { background: "#f1f5f9", color: "#94a3b8" } : isSuspended ? { background: "#fef2f2", color: "#dc2626" } : { background: "#f1f5f9", color: "#94a3b8" }}>
                    {sel.sanctions.length === 0 ? "없음" : `${sel.sanctions.length}건`}
                  </span>
                </div>
                {sel.sanctions.length === 0 ? (
                  <div className="px-4 py-5 text-[13px] text-slate-400">제재 이력이 없습니다</div>
                ) : (
                  <div className="divide-y divide-[#f3f5f7]">
                    {sel.sanctions.map((s) => {
                      const isLifted = s.sanction_type === "lifted";
                      const active = !isLifted && sanctionIsActive(s);
                      const isPermRecord = s.sanction_type === "perm";
                      const pillStyle = isLifted
                        ? { background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }
                        : isPermRecord
                          ? { background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }
                          : { background: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa" };
                      return (
                        <div key={s.id} className="px-4 py-[13px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-bold" style={pillStyle}>
                              {s.label}
                            </span>
                            {!isLifted && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                                style={active ? { background: "#fef2f2", color: "#dc2626" } : { background: "#f1f5f9", color: "#94a3b8" }}>
                                {active ? "적용 중" : "만료"}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-col gap-0.5 text-[12px] text-slate-400">
                            {s.admin_name && (
                              <span>처리: <span className="font-semibold text-slate-600">{s.admin_name}</span></span>
                            )}
                            {s.created_at && <span>{formatDateTime(s.created_at)}</span>}
                            {!isLifted && !isPermRecord && s.expires_at && <span>만료: {formatDateTime(s.expires_at)}</span>}
                            {!isLifted && isPermRecord && <span>만료: 영구</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* footer */}
            <div className="border-t border-[#f1f4f6] px-6 py-[18px]">
              {sanctioning ? (
                <div>
                  <div className="mb-3">
                    <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-400">
                      제재 유형 선택
                    </div>
                    <div className="flex gap-[7px]">
                      {SANCTION_OPTIONS.map((s) => {
                        const selected = pendingSanction === s.key;
                        const isPerm = s.key === "perm";
                        return (
                          <button
                            key={s.key}
                            onClick={() => setPendingSanction(s.key)}
                            className="flex-1 whitespace-nowrap rounded-[9px] border py-[9px] text-center text-[12.5px] font-bold"
                            style={
                              selected
                                ? isPerm
                                  ? { borderColor: "#ef4444", background: "#ef4444", color: "#fff" }
                                  : { borderColor: "#f97316", background: "#fff7ed", color: "#c2410c" }
                                : { borderColor: "#e7ebee", background: "#fff", color: "#64748b" }
                            }
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setSanctioning(false)}
                      className="flex-1 rounded-[11px] border border-[#e2e8eb] bg-slate-50 py-[13px] text-[14px] font-bold text-slate-600 hover:bg-slate-100"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleApplySanction}
                      disabled={isPending}
                      className="flex-[1.4] rounded-[11px] bg-red-500 py-[13px] text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:bg-red-600 disabled:opacity-60"
                    >
                      {isPending ? "처리 중..." : "제재 확인"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setSanctioning(true)}
                      disabled={isPending}
                      className="flex-1 rounded-[11px] border border-red-200 bg-red-50 py-[13px] text-[14px] font-bold text-red-600 hover:bg-red-100 disabled:opacity-60"
                    >
                      제재 부여
                    </button>
                    <button
                      onClick={closeDrawer}
                      className="flex-[1.4] rounded-[11px] border border-[#e2e8eb] bg-white py-[13px] text-[14px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      닫기
                    </button>
                  </div>
                  {isSuspended && (
                    <button
                      onClick={handleLiftSanction}
                      disabled={isPending}
                      className="w-full rounded-[11px] border border-emerald-200 bg-emerald-50 py-[11px] text-[13.5px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {isPending ? "처리 중..." : "제재 해제"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast */}
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
