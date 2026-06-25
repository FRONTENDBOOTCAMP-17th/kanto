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

type ActorRole = "admin" | "super_admin";
type TargetType = "user" | "post" | "report" | "notice" | "maintenance" | "spam_config" | "profanity";

type AuditLog = {
  id: number;
  actor_id: number;
  actor_nickname: string;
  actor_role: ActorRole;
  action: string;
  target_type: TargetType | null;
  target_id: number | null;
  target_label: string | null;
  detail: Record<string, unknown>;
  created_at: string;
};

const ACTION_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  resolve_report:   { label: "신고 처리",     color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",   icon: AlertTriangle },
  dismiss_report:   { label: "신고 기각",     color: "text-slate-500",  bg: "bg-slate-50",  border: "border-slate-200",  icon: AlertTriangle },
  delete_post:      { label: "게시글 삭제",   color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100",    icon: Trash2 },
  delete_comment:   { label: "댓글 삭제",     color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",    icon: Trash2 },
  sanction_user:    { label: "유저 제재",     color: "text-rose-600",   bg: "bg-rose-50",   border: "border-rose-100",   icon: UserX },
  revoke_sanction:  { label: "제재 해제",     color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-100",   icon: UserX },
  write_notice:     { label: "공지 등록",     color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100",  icon: Bell },
  delete_notice:    { label: "공지 삭제",     color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100",  icon: Bell },
  set_maintenance:  { label: "점검 설정",     color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", icon: Settings },
  update_spam:      { label: "스팸 설정 변경", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", icon: MessageSquare },
  add_profanity:    { label: "금칙어 추가",   color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", icon: FileText },
  delete_profanity: { label: "금칙어 삭제",   color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", icon: FileText },
  grant_permission: { label: "권한 부여",     color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-100",   icon: ShieldCheck },
  revoke_permission:{ label: "권한 회수",     color: "text-slate-600",  bg: "bg-slate-50",  border: "border-slate-200",  icon: ShieldCheck },
};

const TARGET_LABELS: Record<TargetType, string> = {
  user: "유저",
  post: "게시글",
  report: "신고",
  notice: "공지",
  maintenance: "점검",
  spam_config: "스팸 설정",
  profanity: "금칙어",
};

const MOCK_LOGS: AuditLog[] = [
  {
    id: 1,
    actor_id: 1,
    actor_nickname: "슈퍼관리자",
    actor_role: "super_admin",
    action: "sanction_user",
    target_type: "user",
    target_id: 42,
    target_label: "마닐라고양이",
    detail: { duration: "7d", reason: "스팸 게시글 반복 작성", prev_role: "user" },
    created_at: "2026-06-25T09:12:33Z",
  },
  {
    id: 2,
    actor_id: 2,
    actor_nickname: "운영팀A",
    actor_role: "admin",
    action: "resolve_report",
    target_type: "report",
    target_id: 188,
    target_label: "욕설 댓글 신고",
    detail: { verdict: "approved", note: "명백한 욕설 확인" },
    created_at: "2026-06-25T08:55:10Z",
  },
  {
    id: 3,
    actor_id: 2,
    actor_nickname: "운영팀A",
    actor_role: "admin",
    action: "delete_post",
    target_type: "post",
    target_id: 3301,
    target_label: "필리핀 비자 사기 정보",
    detail: { reason: "허위 정보 유포" },
    created_at: "2026-06-25T08:41:02Z",
  },
  {
    id: 4,
    actor_id: 1,
    actor_nickname: "슈퍼관리자",
    actor_role: "super_admin",
    action: "write_notice",
    target_type: "notice",
    target_id: 12,
    target_label: "6월 정기 점검 안내",
    detail: { starts_at: "2026-06-28T02:00:00Z", ends_at: "2026-06-28T04:00:00Z" },
    created_at: "2026-06-24T17:30:00Z",
  },
  {
    id: 5,
    actor_id: 4,
    actor_nickname: "콘텐츠팀A",
    actor_role: "admin",
    action: "add_profanity",
    target_type: "profanity",
    target_id: 8,
    target_label: "scope: chat",
    detail: { words: ["욕설1", "욕설2"], scope: "chat" },
    created_at: "2026-06-24T14:22:55Z",
  },
  {
    id: 6,
    actor_id: 1,
    actor_nickname: "슈퍼관리자",
    actor_role: "super_admin",
    action: "grant_permission",
    target_type: "user",
    target_id: 3,
    target_label: "운영팀B",
    detail: { permission: "view_stats", granted_by: "슈퍼관리자" },
    created_at: "2026-06-24T11:05:44Z",
  },
  {
    id: 7,
    actor_id: 3,
    actor_nickname: "운영팀B",
    actor_role: "admin",
    action: "dismiss_report",
    target_type: "report",
    target_id: 175,
    target_label: "광고성 게시글 신고",
    detail: { verdict: "dismissed", note: "광고 기준 미달" },
    created_at: "2026-06-24T10:33:18Z",
  },
  {
    id: 8,
    actor_id: 1,
    actor_nickname: "슈퍼관리자",
    actor_role: "super_admin",
    action: "set_maintenance",
    target_type: "maintenance",
    target_id: 5,
    target_label: "전체 점검",
    detail: { starts_at: "2026-06-28T02:00:00Z", ends_at: "2026-06-28T04:00:00Z", blocked_pages: ["all"] },
    created_at: "2026-06-24T09:00:00Z",
  },
  {
    id: 9,
    actor_id: 2,
    actor_nickname: "운영팀A",
    actor_role: "admin",
    action: "revoke_sanction",
    target_type: "user",
    target_id: 77,
    target_label: "세부여행자",
    detail: { reason: "이의 신청 검토 후 해제" },
    created_at: "2026-06-23T16:48:30Z",
  },
  {
    id: 10,
    actor_id: 1,
    actor_nickname: "슈퍼관리자",
    actor_role: "super_admin",
    action: "update_spam",
    target_type: "spam_config",
    target_id: 1,
    target_label: "스팸 감지 설정",
    detail: { prev: { chat_max_count: 5 }, next: { chat_max_count: 3 } },
    created_at: "2026-06-23T13:20:05Z",
  },
  {
    id: 11,
    actor_id: 4,
    actor_nickname: "콘텐츠팀A",
    actor_role: "admin",
    action: "delete_comment",
    target_type: "post",
    target_id: 2987,
    target_label: "게시글 #2987 댓글",
    detail: { comment_id: 9041, reason: "혐오 표현" },
    created_at: "2026-06-23T11:55:12Z",
  },
  {
    id: 12,
    actor_id: 1,
    actor_nickname: "슈퍼관리자",
    actor_role: "super_admin",
    action: "revoke_permission",
    target_type: "user",
    target_id: 5,
    target_label: "이전운영자",
    detail: { permission: "delete_post" },
    created_at: "2026-06-22T18:10:00Z",
  },
];

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
        {/* Drawer header */}
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
          {/* Action */}
          <div className="rounded-2xl border border-[#ebeef0] bg-slate-50 p-4">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">액션</p>
            <ActionBadge action={log.action} />
          </div>

          {/* Actor */}
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

          {/* Target */}
          {log.target_type && (
            <div className="rounded-2xl border border-[#ebeef0] bg-white p-4">
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">대상</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13.5px] font-semibold text-slate-800">{log.target_label ?? `#${log.target_id}`}</p>
                  <p className="text-[12px] text-slate-400">
                    {TARGET_LABELS[log.target_type]} · ID {log.target_id}
                  </p>
                </div>
                <span className="rounded-full border border-[#ebeef0] bg-slate-50 px-2.5 py-0.5 text-[12px] font-medium text-slate-500">
                  {TARGET_LABELS[log.target_type]}
                </span>
              </div>
            </div>
          )}

          {/* Detail JSONB */}
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

          {/* Timestamp */}
          <div className="rounded-2xl border border-[#ebeef0] bg-white p-4">
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-400">발생 시각</p>
            <p className="text-[13.5px] font-semibold text-slate-800">{formatDate(log.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<ActorRole | "all">("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterTarget, setFilterTarget] = useState<TargetType | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);

  const filtered = MOCK_LOGS.filter((log) => {
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

  return (
    <>
      {selectedLog && (
        <DetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

      <div className="p-6 lg:p-8">
        {/* Header */}
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

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "전체 로그", value: MOCK_LOGS.length, color: "text-slate-900" },
            {
              label: "오늘 행위",
              value: MOCK_LOGS.filter((l) => l.created_at.startsWith("2026-06-25")).length,
              color: "text-teal-600",
            },
            {
              label: "제재 / 삭제",
              value: MOCK_LOGS.filter((l) =>
                ["sanction_user", "delete_post", "delete_comment"].includes(l.action),
              ).length,
              color: "text-rose-500",
            },
            {
              label: "권한 변경",
              value: MOCK_LOGS.filter((l) =>
                ["grant_permission", "revoke_permission"].includes(l.action),
              ).length,
              color: "text-amber-500",
            },
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

        {/* Filter Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Search */}
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

          {/* Role filter */}
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

          {/* Action filter dropdown */}
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
              <div
                className="absolute left-0 top-full z-20 mt-1.5 w-44 rounded-2xl border border-[#ebeef0] bg-white py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
                onBlur={() => setActionDropdownOpen(false)}
              >
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
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.bg.replace("bg-", "bg-").replace("50", "400")}`} />
                    {meta.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Target type filter */}
          <div className="relative">
            <select
              value={filterTarget}
              onChange={(e) => { setFilterTarget(e.target.value as TargetType | "all"); setPage(1); }}
              className="appearance-none rounded-xl border border-[#ebeef0] bg-white px-3.5 py-2 pr-8 text-[13px] font-medium text-slate-500 outline-none hover:bg-slate-50 focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            >
              <option value="all">대상 전체</option>
              {(Object.keys(TARGET_LABELS) as TargetType[]).map((t) => (
                <option key={t} value={t}>{TARGET_LABELS[t]}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" strokeWidth={2} />
          </div>

          {/* Date filter hint */}
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

        {/* Table */}
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
                    {/* ID */}
                    <td className="px-5 py-4 text-[12px] text-slate-400">#{log.id}</td>

                    {/* Actor */}
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

                    {/* Action */}
                    <td className="px-5 py-4">
                      <ActionBadge action={log.action} />
                    </td>

                    {/* Target */}
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

                    {/* Date */}
                    <td className="hidden px-5 py-4 whitespace-nowrap text-slate-500 lg:table-cell">
                      {formatDate(log.created_at)}
                    </td>

                    {/* Chevron */}
                    <td className="px-4 py-4">
                      <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={2} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
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
