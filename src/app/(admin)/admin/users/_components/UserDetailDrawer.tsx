"use client";

import { useState, useTransition } from "react";
import { Users, ExternalLink, X, AlertTriangle } from "lucide-react";
import { AdminPagination } from "@/app/(admin)/admin/_components/AdminPagination";
import { User, SanctionRecord } from "@/services/admin/adminUsers";
import { applySanction } from "@/app/(admin)/admin/users/_actions/applySanction";
import { liftSanction } from "@/app/(admin)/admin/users/_actions/liftSanction";
import { resolveUserReports } from "@/app/(admin)/admin/users/_actions/resolveUserReports";
import { formatDate, formatDateTime } from "@/utils/format";

const SANCTION_OPTIONS: { key: "7d" | "30d" | "perm"; label: string }[] = [
  { key: "7d", label: "7일 정지" },
  { key: "30d", label: "30일 정지" },
  { key: "perm", label: "영구 정지" },
];


const SANCTION_PAGE_SIZE = 5;

interface Props {
  user: User;
  onClose: () => void;
  onChanged?: (userId: number, patch: Partial<User>) => void;
  onToast?: (msg: string) => void;
}

export default function UserDetailDrawer({ user, onClose, onChanged, onToast }: Props) {
  const [sanctioning, setSanctioning] = useState(false);
  const [sanctionPage, setSanctionPage] = useState(1);
  const [pendingSanction, setPendingSanction] = useState<"7d" | "30d" | "perm">("7d");
  const [localSanctions, setLocalSanctions] = useState<SanctionRecord[]>([]);
  const [localSuspended, setLocalSuspended] = useState<string | null | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const suspendedUntil = localSuspended !== undefined ? localSuspended : user.suspended_until;
  const sanctions = [...localSanctions, ...user.sanctions];

  const isPerm = suspendedUntil === "9999-12-31T23:59:59Z";
  const isSuspended =
    suspendedUntil != null && (isPerm || new Date(suspendedUntil) > new Date());

  const sanctionTotalPages = Math.max(1, Math.ceil(sanctions.length / SANCTION_PAGE_SIZE));
  const sanctionCurPage = Math.min(sanctionPage, sanctionTotalPages);
  const sanctionStart = (sanctionCurPage - 1) * SANCTION_PAGE_SIZE;
  const pagedSanctions = sanctions.slice(sanctionStart, sanctionStart + SANCTION_PAGE_SIZE);

  function sanctionIsActive(s: SanctionRecord) {
    if (s.sanction_type === "perm") return true;
    if (!s.expires_at) return false;
    return new Date(s.expires_at) > new Date();
  }

  function handleApplySanction() {
    const userId = user.id;
    const hadPending = user.pending_report_count > 0;
    startTransition(async () => {
      try {
        const record = await applySanction(userId, pendingSanction);
        if (hadPending) await resolveUserReports(userId);
        setLocalSanctions((prev) => [record, ...prev]);
        setLocalSuspended(record.expires_at);
        const patch: Partial<User> = { suspended_until: record.expires_at };
        if (hadPending) {
          patch.pending_report_count = 0;
          patch.pending_reports = [];
        }
        onChanged?.(userId, patch);
        setSanctioning(false);
        onToast?.(
          hadPending
            ? `${user.name}에게 ${record.label} 제재를 부여하고 신고를 처리했습니다`
            : `${user.name}에게 ${record.label} 제재를 부여했습니다`,
        );
      } catch {
        onToast?.("제재 적용 실패 — 다시 시도해주세요");
      }
    });
  }

  function handleLiftSanction() {
    const userId = user.id;
    const userName = user.name;
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
        setLocalSanctions((prev) => [liftRecord, ...prev]);
        setLocalSuspended(null);
        onChanged?.(userId, { suspended_until: null });
        onToast?.(`${userName}의 제재를 해제했습니다`);
      } catch {
        onToast?.("제재 해제 실패 — 다시 시도해주세요");
      }
    });
  }

  return (
    <>
      <style>{`
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div onClick={onClose} className="fixed inset-0 z-[70] bg-slate-900/45" style={{ animation: "fadeIn .18s ease" }} />
      <div className="fixed right-0 top-0 z-[71] flex h-screen w-[460px] max-w-full flex-col bg-white shadow-[-12px_0_44px_rgba(15,23,42,0.18)]" style={{ animation: "drawerIn .26s cubic-bezier(.4,0,.2,1)" }}>

        <div className="flex items-center justify-between gap-3 border-b border-[#f1f4f6] px-6 py-[22px]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">유저 상세</h2>
            <span className="text-[12.5px] font-semibold text-slate-400">#{user.id}</span>
          </div>
          <button onClick={onClose} className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#eef1f3] bg-white text-slate-500 hover:bg-slate-100">
            <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-6">
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
            {user.report_count > 0 && (
              <span className="inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-1 text-[12px] font-semibold" style={{ background: "#fef2f2", color: "#dc2626" }}>
                신고 {user.report_count}건
              </span>
            )}
          </div>

          {user.pending_report_count > 0 && (
            <div className="mb-5 rounded-[14px] border border-red-100 bg-red-50 p-[14px]">
              <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-red-500">
                <AlertTriangle className="h-[15px] w-[15px]" strokeWidth={2.2} />
                처리 대기 신고 {user.pending_report_count}건
              </div>
              <div className="mt-2.5 flex flex-col gap-2">
                {user.pending_reports.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[11.5px] font-bold text-red-600">
                      {r.reason}
                    </span>
                    {r.description && (
                      <span className="text-[13px] leading-relaxed text-slate-600">
                        {r.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-5 rounded-[14px] border border-[#eef1f3] bg-slate-50 p-[18px]">
            <div className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">
              <Users className="h-[17px] w-[17px] text-teal-600" strokeWidth={2} />
              회원
            </div>
            <div className="text-[15.5px] font-bold text-slate-900">{user.name}</div>
            {user.email && <div className="mt-1 text-[13.5px] text-slate-500">{user.email}</div>}
            <a href={`/admin/users/${user.id}`} target="_blank" rel="noreferrer" className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange-500">
              상세 프로필 보기
              <ExternalLink className="h-[14px] w-[14px]" strokeWidth={2.2} />
            </a>
          </div>

          <div className="mb-5 overflow-hidden rounded-xl border border-[#eef1f3]">
            <div className="flex items-center justify-between border-b border-[#f3f5f7] px-4 py-[11px]">
              <span className="text-[13px] text-slate-400">작성 글</span>
              <span className="text-[13px] font-semibold text-slate-900">{(user.post_count ?? 0).toLocaleString()}개</span>
            </div>
            <div className="flex items-center justify-between px-4 py-[11px]">
              <span className="text-[13px] text-slate-400">가입일</span>
              <span className="text-[13px] font-semibold text-slate-900">{formatDate(user.created_at)}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[14px] border border-[#eef1f3]">
            <div className="flex items-center gap-2 border-b border-[#f1f4f6] bg-slate-50 px-4 py-[13px]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isSuspended ? "#dc2626" : "#94a3b8"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <span className="text-[13px] font-extrabold text-slate-900">제재 이력</span>
              <span className="ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                style={sanctions.length === 0 ? { background: "#f1f5f9", color: "#94a3b8" } : isSuspended ? { background: "#fef2f2", color: "#dc2626" } : { background: "#f1f5f9", color: "#94a3b8" }}>
                {sanctions.length === 0 ? "없음" : `${sanctions.length}건`}
              </span>
            </div>
            {sanctions.length === 0 ? (
              <div className="px-4 py-5 text-[13px] text-slate-400">제재 이력이 없습니다</div>
            ) : (
              <>
              <div className="divide-y divide-[#f3f5f7]">
                {pagedSanctions.map((s) => {
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
              {sanctionTotalPages > 1 && (
                <AdminPagination
                  currentPage={sanctionCurPage}
                  totalPages={sanctionTotalPages}
                  onPageChange={setSanctionPage}
                />
              )}
              </>
            )}
          </div>
        </div>

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
                    const optPerm = s.key === "perm";
                    return (
                      <button
                        key={s.key}
                        onClick={() => setPendingSanction(s.key)}
                        className="flex-1 whitespace-nowrap rounded-[9px] border py-[9px] text-center text-[12.5px] font-bold"
                        style={
                          selected
                            ? optPerm
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
                  onClick={onClose}
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
  );
}
