"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Crown,
  Filter,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import type { AuditLog, AuditTargetType } from "@/services/admin/auditLog";
import { ACTION_META, TARGET_LABELS, formatShortDate } from "./auditLogConfig";
import { ActionBadge } from "./ActionBadge";
import { DetailDrawer } from "./DetailDrawer";
import { useAuditFilters } from "./useAuditFilters";

const SANCTION_ACTIONS = ["sanction_user", "delete_post", "delete_comment"];
const PERMISSION_ACTIONS = ["grant_permission", "revoke_permission", "promote_admin", "revoke_admin"];

function computeStats(logs: AuditLog[], today: string) {
  return {
    total: logs.length,
    todayCount: logs.filter((l) => l.created_at.startsWith(today)).length,
    sanctionDeleteCount: logs.filter((l) => SANCTION_ACTIONS.includes(l.action)).length,
    permissionCount: logs.filter((l) => PERMISSION_ACTIONS.includes(l.action)).length,
  };
}

interface Props {
  initialLogs: AuditLog[];
}

export function AuditLogsClient({ initialLogs }: Props) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const filters = useAuditFilters(initialLogs);
  const stats = computeStats(initialLogs, filters.today);

  const statCards = [
    { label: "전체 로그",  value: stats.total,              color: "text-slate-900" },
    { label: "오늘 행위",  value: stats.todayCount,         color: "text-teal-600"  },
    { label: "제재 / 삭제", value: stats.sanctionDeleteCount, color: "text-rose-500"  },
    { label: "권한 변경",  value: stats.permissionCount,    color: "text-amber-500" },
  ];

  return (
    <>
      {selectedLog && (
        <DetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

      <div className="p-6 lg:p-8">
        
        <div className="mb-7">
          <Link
            href="/admin/operation"
            className="mb-2 flex cursor-pointer items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600"
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
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              <p className="text-[13px] font-medium text-slate-500">{card.label}</p>
              <p className={`mt-2 text-[26px] font-extrabold tracking-tight ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput
            value={filters.searchQuery}
            onChange={(v) => { filters.setSearchQuery(v); filters.setPage(1); }}
          />
          <RoleToggle
            value={filters.filterRole}
            onChange={(v) => { filters.setFilterRole(v); filters.setPage(1); }}
          />
          <ActionDropdown
            value={filters.filterAction}
            open={filters.actionDropdownOpen}
            onToggle={() => filters.setActionDropdownOpen((v) => !v)}
            onChange={(v) => { filters.setFilterAction(v); filters.setActionDropdownOpen(false); filters.setPage(1); }}
          />
          <TargetSelect
            value={filters.filterTarget}
            onChange={(v) => { filters.setFilterTarget(v); filters.setPage(1); }}
          />
          <DateRangeDropdown
            open={filters.dateDropdownOpen}
            onToggle={() => filters.setDateDropdownOpen((v) => !v)}
            dateFrom={filters.filterDateFrom}
            dateTo={filters.filterDateTo}
            today={filters.today}
            hasActiveDate={!!filters.hasActiveDate}
            onChangeDateFrom={(v) => { filters.setFilterDateFrom(v); filters.setPage(1); }}
            onChangeDateTo={(v) => { filters.setFilterDateTo(v); filters.setPage(1); }}
            onReset={() => { filters.setFilterDateFrom(""); filters.setFilterDateTo(""); filters.setPage(1); }}
            onApply={() => filters.setDateDropdownOpen(false)}
          />
          {filters.hasActiveFilters && (
            <button
              onClick={filters.resetFilters}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-[12.5px] font-medium text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              필터 초기화
            </button>
          )}
          <span className="ml-auto text-[13px] text-slate-400">{filters.filtered.length.toLocaleString()}건</span>
        </div>

        
        <LogTable logs={filters.paginated} onSelect={setSelectedLog} />

        
        {filters.totalPages > 1 && (
          <Pagination
            page={filters.page}
            totalPages={filters.totalPages}
            totalCount={filters.filtered.length}
            onChange={filters.setPage}
          />
        )}
      </div>
    </>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#ebeef0] bg-white px-3.5 py-2 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
      <Search className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="행위자 · 대상 검색"
        className="w-40 bg-transparent text-[13.5px] text-slate-800 outline-none placeholder:text-slate-300"
      />
      {value && (
        <button onClick={() => onChange("")} className="cursor-pointer text-slate-300 hover:text-slate-500">
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

type ActorRoleFilter = "all" | "admin" | "super_admin";

function RoleToggle({ value, onChange }: { value: ActorRoleFilter; onChange: (v: ActorRoleFilter) => void }) {
  return (
    <div className="flex gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
      {(["all", "super_admin", "admin"] as const).map((role) => (
        <button
          key={role}
          onClick={() => onChange(role)}
          className={[
            "flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
            value === role ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600",
          ].join(" ")}
        >
          {role === "all" && "전체"}
          {role === "super_admin" && (<><Crown className="h-3 w-3 text-amber-500" strokeWidth={2.5} />슈퍼어드민</>)}
          {role === "admin" && (<><ShieldCheck className="h-3 w-3 text-teal-500" strokeWidth={2.5} />어드민</>)}
        </button>
      ))}
    </div>
  );
}

function ActionDropdown({
  value, open, onToggle, onChange,
}: {
  value: string;
  open: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={[
          "flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-colors",
          value !== "all"
            ? "border-teal-300 bg-teal-50 text-teal-700"
            : "border-[#ebeef0] bg-white text-slate-500 hover:bg-slate-50",
        ].join(" ")}
      >
        <Filter className="h-3.5 w-3.5" strokeWidth={2} />
        {value === "all" ? "액션 전체" : (ACTION_META[value]?.label ?? value)}
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-44 rounded-2xl border border-[#ebeef0] bg-white py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => onChange("all")}
            className={[
              "flex w-full cursor-pointer items-center px-4 py-2 text-[13px] transition-colors hover:bg-slate-50",
              value === "all" ? "font-semibold text-slate-800" : "text-slate-500",
            ].join(" ")}
          >
            전체
          </button>
          {Object.entries(ACTION_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={[
                "flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-[13px] transition-colors hover:bg-slate-50",
                value === key ? "font-semibold text-slate-800" : "text-slate-500",
              ].join(" ")}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.bg.replace("50", "400")}`} />
              {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TargetSelect({
  value, onChange,
}: {
  value: AuditTargetType | "all";
  onChange: (v: AuditTargetType | "all") => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AuditTargetType | "all")}
        className="cursor-pointer appearance-none rounded-xl border border-[#ebeef0] bg-white px-3.5 py-2 pr-8 text-[13px] font-medium text-slate-500 outline-none hover:bg-slate-50 focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
      >
        <option value="all">대상 전체</option>
        {(Object.keys(TARGET_LABELS) as AuditTargetType[]).map((t) => (
          <option key={t} value={t}>{TARGET_LABELS[t]}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" strokeWidth={2} />
    </div>
  );
}

function DateRangeDropdown({
  open, onToggle, dateFrom, dateTo, today, hasActiveDate,
  onChangeDateFrom, onChangeDateTo, onReset, onApply,
}: {
  open: boolean;
  onToggle: () => void;
  dateFrom: string;
  dateTo: string;
  today: string;
  hasActiveDate: boolean;
  onChangeDateFrom: (v: string) => void;
  onChangeDateTo: (v: string) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={[
          "flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-colors",
          hasActiveDate
            ? "border-teal-300 bg-teal-50 text-teal-700"
            : "border-[#ebeef0] bg-white text-slate-500 hover:bg-slate-50",
        ].join(" ")}
      >
        <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
        {hasActiveDate
          ? `${dateFrom ? formatShortDate(dateFrom) : "시작"} ~ ${dateTo ? formatShortDate(dateTo) : "종료"}`
          : "날짜 범위"}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-64 rounded-2xl border border-[#ebeef0] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">날짜 범위 선택</p>
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-slate-500">시작일</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || today}
                onChange={(e) => onChangeDateFrom(e.target.value)}
                className="w-full rounded-xl border border-[#ebeef0] px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-slate-500">종료일</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                max={today}
                onChange={(e) => onChangeDateTo(e.target.value)}
                className="w-full rounded-xl border border-[#ebeef0] px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onReset}
                className="flex-1 cursor-pointer rounded-xl border border-[#ebeef0] py-2 text-[12.5px] font-semibold text-slate-500 hover:bg-slate-50"
              >
                초기화
              </button>
              <button
                onClick={onApply}
                className="flex-1 rounded-xl bg-teal-500 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-600"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogTable({ logs, onSelect }: { logs: AuditLog[]; onSelect: (log: AuditLog) => void }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-300">
          <ClipboardList className="h-10 w-10" strokeWidth={1.5} />
          <p className="text-[14px]">조건에 맞는 로그가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
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
          {logs.map((log, i) => (
            <LogRow key={log.id} log={log} isLast={i === logs.length - 1} onSelect={onSelect} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogRow({ log, isLast, onSelect }: { log: AuditLog; isLast: boolean; onSelect: (log: AuditLog) => void }) {
  return (
    <tr
      onClick={() => onSelect(log)}
      className={["cursor-pointer transition-colors hover:bg-slate-50", !isLast ? "border-b border-[#ebeef0]" : ""].join(" ")}
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
        {new Date(log.created_at).toLocaleString("ko-KR", {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit",
        })}
      </td>
      <td className="px-4 py-4">
        <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={2} />
      </td>
    </tr>
  );
}

function Pagination({
  page, totalPages, totalCount, onChange,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  onChange: (p: number) => void;
}) {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-[13px] text-slate-400">
        {(page - 1) * 10 + 1}–{Math.min(page * 10, totalCount)} / {totalCount}건
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-lg border border-[#ebeef0] p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={[
              "h-9 w-9 rounded-lg text-[13.5px] font-semibold transition-colors",
              p === page ? "bg-teal-500 text-white" : "border border-[#ebeef0] text-slate-500 hover:bg-slate-50",
            ].join(" ")}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded-lg border border-[#ebeef0] p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
