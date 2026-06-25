"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
  X,
  ChevronDown,
  Crown,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Bell,
  UserX,
  Trash2,
  MessageSquare,
  Settings,
  Filter,
  Calendar,
} from "lucide-react";
import type { AuditLog, AuditTargetType } from "@/services/admin/auditLog";

type ActorRole = "admin" | "super_admin";

const ACTION_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  resolve_report:    { label: "신고 처리",      color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",   icon: AlertTriangle },
  dismiss_report:    { label: "신고 기각",      color: "text-slate-500",  bg: "bg-slate-50",  border: "border-slate-200",  icon: AlertTriangle },
  delete_post:       { label: "게시글 삭제",    color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100",    icon: Trash2 },
  delete_comment:    { label: "댓글 삭제",      color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",    icon: Trash2 },
  sanction_user:     { label: "유저 제재",      color: "text-rose-600",   bg: "bg-rose-50",   border: "border-rose-100",   icon: UserX },
  revoke_sanction:   { label: "제재 해제",      color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-100",   icon: UserX },
  write_notice:      { label: "공지 등록",      color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100",  icon: Bell },
  delete_notice:     { label: "공지 삭제",      color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100",  icon: Bell },
  set_maintenance:   { label: "점검 설정",      color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", icon: Settings },
  update_spam:       { label: "스팸 설정 변경", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", icon: MessageSquare },
  add_profanity:     { label: "금칙어 추가",    color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", icon: FileText },
  delete_profanity:  { label: "금칙어 삭제",    color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", icon: FileText },
  grant_permission:  { label: "권한 부여",      color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-100",   icon: ShieldCheck },
  revoke_permission: { label: "권한 회수",      color: "text-slate-600",  bg: "bg-slate-50",  border: "border-slate-200",  icon: ShieldCheck },
  promote_admin:     { label: "어드민 등록",    color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-100",   icon: ShieldCheck },
  revoke_admin:      { label: "어드민 해제",    color: "text-slate-600",  bg: "bg-slate-50",  border: "border-slate-200",  icon: ShieldCheck },
};

const TARGET_LABELS: Record<AuditTargetType, string> = {
  user: "유저",
  post: "게시글",
  report: "신고",
  notice: "공지",
  maintenance: "점검",
  spam_config: "스팸 설정",
  profanity: "금칙어",
};

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action];
  if (!meta) return <span className="text-[12px] text-slate-400">{action}</span>;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${meta.color} ${meta.bg} ${meta.border}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

function DetailDrawer({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const entries = Object.entries(log.detail);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 backdrop-blur-sm sm:items-start"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white shadow-[0_0_40px_rgba(0,0,0,0.14)] sm:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ebeef0] bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-teal-500" strokeWidth={2} />
            <span className="text-[15px] font-semibold text-slate-800">로그 상세</span>
            <span className="text-[13px] text-slate-400">#{log.id}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <div className="rounded-2xl border border-[#ebeef0] bg-slate-50 p-4">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">액션</p>
            <ActionBadge action={log.action} />
          </div>

          <div className="rounded-2xl border border-[#ebeef0] bg-white p-4">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">행위자</p>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${log.actor_role === "super_admin" ? "bg-amber-100" : "bg-teal-50"}`}
              >
                {log.actor_role === "super_admin" ? (
                  <Crown className="h-4 w-4 text-amber-500" strokeWidth={2} />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-teal-500" strokeWidth={2} />
                )}
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800">{log.actor_nickname}</p>
                <p className="text-[12px] text-slate-400">
                  {log.actor_role === "super_admin" ? "슈퍼어드민" : "어드민"} · ID {log.actor_id}
                </p>
              </div>
            </div>
          </div>

          {log.target_type && (
            <div className="rounded-2xl border border-[#ebeef0] bg-white p-4">
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">대상</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13.5px] font-semibold text-slate-800">{log.target_label ?? `#${log.target_id}`}</p>
                  <p className="text-[12px] text-slate-400">
                    {TARGET_LABELS[log.target_type]}
                    {log.target_id ? ` · ID ${log.target_id}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-[#ebeef0] bg-slate-50 px-2.5 py-0.5 text-[12px] font-medium text-slate-500">
                  {TARGET_LABELS[log.target_type]}
                </span>
              </div>
            </div>
          )}

          {entries.length > 0 && (
            <div className="rounded-2xl border border-[#ebeef0] bg-white p-4">
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">상세 정보</p>
              <div className="flex flex-col gap-2">
                {entries.map(([key, val]) => (
                  <div key={key} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="shrink-0 text-[12px] font-semibold text-slate-500">{key}</span>
                    <span className="min-w-0 break-all text-[12px] text-slate-700">
                      {typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[#ebeef0] bg-white p-4">
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-400">발생 시각</p>
            <p className="text-[13.5px] font-semibold text-slate-800">{formatDate(log.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  initialLogs: AuditLog[];
}

export function AuditLogsClient({ initialLogs }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<ActorRole | "all">("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterTarget, setFilterTarget] = useState<AuditTargetType | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = initialLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      log.actor_nickname.toLowerCase().includes(q) ||
      log.target_label?.toLowerCase().includes(q) ||
      String(log.target_id).includes(q);
    const matchRole = filterRole === "all" || log.actor_role === filterRole;
    const matchAction = filterAction === "all" || log.action === filterAction;
    const matchTarget = filterTarget === "all" || log.target_type === filterTarget;
    return matchSearch && matchRole && matchAction && matchTarget;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setSearchQuery("");
    setFilterRole("all");
    setFilterAction("all");
    setFilterTarget("all");
    setPage(1);
  }

  const hasActiveFilters =
    searchQuery || filterRole !== "all" || filterAction !== "all" || filterTarget !== "all";

  const todayCount = initialLogs.filter((l) => l.created_at.startsWith(today)).length;
  const sanctionDeleteCount = initialLogs.filter((l) =>
    ["sanction_user", "delete_post", "delete_comment"].includes(l.action),
  ).length;
  const permissionCount = initialLogs.filter((l) =>
    ["grant_permission", "revoke_permission", "promote_admin", "revoke_admin"].includes(l.action),
  ).length;

  return (
    <>
      {selectedLog && (
        <DetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

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
              <ClipboardList className="h-5 w-5 text-teal-600" strokeWidth={2} />
            </div>
            <h1 className="text-[24px] font-bold text-slate-900">감사 로그</h1>
          </div>
          <p className="mt-1 text-[13px] text-slate-500">
            어드민 및 슈퍼어드민의 모든 운영 행위를 기록합니다. 슈퍼어드민 전용 페이지입니다.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "전체 로그", value: initialLogs.length, color: "text-slate-900" },
            { label: "오늘 행위", value: todayCount, color: "text-teal-600" },
            { label: "제재 / 삭제", value: sanctionDeleteCount, color: "text-rose-500" },
            { label: "권한 변경", value: permissionCount, color: "text-amber-500" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              <p className="text-[13px] font-medium text-slate-500">{card.label}</p>
              <p className={`mt-2 text-[26px] font-extrabold tracking-tight ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-[#ebeef0] bg-white px-3.5 py-2 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
            <Search className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="행위자 · 대상 검색"
              className="w-40 bg-transparent text-[13.5px] text-slate-800 outline-none placeholder:text-slate-300"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setPage(1); }} className="text-slate-300 hover:text-slate-500">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="flex gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
            {(["all", "super_admin", "admin"] as const).map((role) => (
              <button
                key={role}
                onClick={() => { setFilterRole(role); setPage(1); }}
                className={[
                  "flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                  filterRole === role
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                ].join(" ")}
              >
                {role === "all" && "전체"}
                {role === "super_admin" && (
                  <>
                    <Crown className="h-3 w-3 text-amber-500" strokeWidth={2.5} />
                    슈퍼어드민
                  </>
                )}
                {role === "admin" && (
                  <>
                    <ShieldCheck className="h-3 w-3 text-teal-500" strokeWidth={2.5} />
                    어드민
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setActionDropdownOpen((v) => !v)}
              className={[
                "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-colors",
                filterAction !== "all"
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-[#ebeef0] bg-white text-slate-500 hover:bg-slate-50",
              ].join(" ")}
            >
              <Filter className="h-3.5 w-3.5" strokeWidth={2} />
              {filterAction === "all" ? "액션 전체" : (ACTION_META[filterAction]?.label ?? filterAction)}
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
            </button>

            {actionDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1.5 w-44 rounded-2xl border border-[#ebeef0] bg-white py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
                <button
                  onClick={() => { setFilterAction("all"); setActionDropdownOpen(false); setPage(1); }}
                  className={[
                    "flex w-full items-center px-4 py-2 text-[13px] transition-colors hover:bg-slate-50",
                    filterAction === "all" ? "font-semibold text-slate-800" : "text-slate-500",
                  ].join(" ")}
                >
                  전체
                </button>
                {Object.entries(ACTION_META).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => { setFilterAction(key); setActionDropdownOpen(false); setPage(1); }}
                    className={[
                      "flex w-full items-center gap-2 px-4 py-2 text-[13px] transition-colors hover:bg-slate-50",
                      filterAction === key ? "font-semibold text-slate-800" : "text-slate-500",
                    ].join(" ")}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.bg.replace("50", "400")}`} />
                    {meta.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <select
              value={filterTarget}
              onChange={(e) => { setFilterTarget(e.target.value as AuditTargetType | "all"); setPage(1); }}
              className="appearance-none rounded-xl border border-[#ebeef0] bg-white px-3.5 py-2 pr-8 text-[13px] font-medium text-slate-500 outline-none hover:bg-slate-50 focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            >
              <option value="all">대상 전체</option>
              {(Object.keys(TARGET_LABELS) as AuditTargetType[]).map((t) => (
                <option key={t} value={t}>{TARGET_LABELS[t]}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" strokeWidth={2} />
          </div>

          <button className="flex items-center gap-1.5 rounded-xl border border-[#ebeef0] bg-white px-3.5 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50">
            <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
            날짜 범위
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-[12.5px] font-medium text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              필터 초기화
            </button>
          )}

          <span className="ml-auto text-[13px] text-slate-400">
            {filtered.length.toLocaleString()}건
          </span>
        </div>

        <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-300">
              <ClipboardList className="h-10 w-10" strokeWidth={1.5} />
              <p className="text-[14px]">조건에 맞는 로그가 없습니다.</p>
            </div>
          ) : (
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-[#ebeef0] text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">행위자</th>
                  <th className="px-5 py-3.5">액션</th>
                  <th className="hidden px-5 py-3.5 md:table-cell">대상</th>
                  <th className="hidden px-5 py-3.5 whitespace-nowrap lg:table-cell">발생 시각</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((log, i) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={[
                      "cursor-pointer transition-colors hover:bg-slate-50",
                      i !== paginated.length - 1 ? "border-b border-[#ebeef0]" : "",
                    ].join(" ")}
                  >
                    <td className="px-5 py-4 text-[12px] text-slate-400">#{log.id}</td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${log.actor_role === "super_admin" ? "bg-amber-100" : "bg-teal-50"}`}
                        >
                          {log.actor_role === "super_admin" ? (
                            <Crown className="h-3.5 w-3.5 text-amber-500" strokeWidth={2} />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5 text-teal-500" strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">{log.actor_nickname}</p>
                          <p className="text-[11.5px] text-slate-400">
                            {log.actor_role === "super_admin" ? "슈퍼어드민" : "어드민"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <ActionBadge action={log.action} />
                    </td>

                    <td className="hidden px-5 py-4 md:table-cell">
                      {log.target_type ? (
                        <div>
                          <p className="text-slate-700">{log.target_label ?? `#${log.target_id}`}</p>
                          <p className="text-[11.5px] text-slate-400">
                            {TARGET_LABELS[log.target_type]}
                            {log.target_id ? ` #${log.target_id}` : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td className="hidden px-5 py-4 whitespace-nowrap text-slate-500 lg:table-cell">
                      {formatDate(log.created_at)}
                    </td>

                    <td className="px-4 py-4">
                      <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={2} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[13px] text-slate-400">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}건
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-[#ebeef0] p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    "h-9 w-9 rounded-lg text-[13.5px] font-semibold transition-colors",
                    p === page
                      ? "bg-teal-500 text-white"
                      : "border border-[#ebeef0] text-slate-500 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-[#ebeef0] p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
