"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Flag, FileText, User, X, ExternalLink } from "lucide-react";
import { AdminPagination } from "@/app/(admin)/admin/_components/AdminPagination";
import { REPORT_STATUS } from "@/constants/report";
import {
  REASON_STYLE,
  CATEGORY_STYLE,
  STATUS_STYLE,
  SANCTION_LABEL,
  PAGE_SIZE,
} from "../_lib/constants";
import { formatDateTime } from "@/utils/format";
import type { Report, Outcome, ReportType, Status, Sanction } from "@/type/admin";
import {
  resolveReport,
  dismissReport,
  updateReportResolution,
} from "../_lib/actions";
import { getPostDetailUrl } from "@/services/admin/adminPosts";

interface Props {
  reports: Report[];
}

function Pill({
  text,
  fg,
  bg,
  bold,
}: {
  text: string;
  fg: string;
  bg: string;
  bold?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-1 text-[12px]"
      style={{ background: bg, color: fg, fontWeight: bold ? 700 : 600 }}
    >
      {text}
    </span>
  );
}

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

export default function ReportsClient({ reports }: Props) {
  const [type, setType] = useState<"all" | ReportType>("all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selId, setSelId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [deactivate, setDeactivate] = useState(false);
  const [sanction, setSanction] = useState<Sanction>("none");
  const [overrides, setOverrides] = useState<Record<number, Status>>({});
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(""), 2600);
  }
  function setFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  const all = useMemo(
    () => reports.map((r) => ({ ...r, status: overrides[r.id] ?? r.status })),
    [reports, overrides],
  );

  const totalCount = all.length;
  const pendingCount = all.filter((r) => r.status === REPORT_STATUS.PENDING).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((r) => {
      if (type !== "all" && r.type !== type) return false;
      if (status !== "all" && r.status !== status) return false;
      if (q)
        return (r.targetName + " " + r.reason + " " + r.description)
          .toLowerCase()
          .includes(q);
      return true;
    });
  }, [all, type, status, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const startIdx = (curPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const sel = selId != null ? (all.find((r) => r.id === selId) ?? null) : null;
  const selIsPending = sel?.status === REPORT_STATUS.PENDING;
  const sanctionTarget = sel
    ? sel.type === "post"
      ? sel.author
      : sel.targetName
    : "";

  function openDrawer(id: number) {
    setSelId(id);
    setEditing(false);
    setDeactivate(false);
    setSanction("none");
  }
  function startEdit() {
    if (!sel) return;
    setDeactivate(sel.postDeactivated ?? false);
    setSanction(sel.sanctionType ?? "none");
    setEditing(true);
  }
  function resolve() {
    if (selId == null || !sel) return;
    const parts: string[] = [];
    if (deactivate) parts.push("게시글 비활성화");
    if (sanction !== "none")
      parts.push(`${sanctionTarget} ${SANCTION_LABEL[sanction]}`);
    const outcome: Outcome = {
      deactivated: deactivate,
      sanctionLabel: sanction !== "none" ? SANCTION_LABEL[sanction] : "",
      target: sanctionTarget ?? "",
      resolvedDate: new Date().toISOString().split("T")[0],
    };
    if (editing) {
      setOutcomes((o) => ({ ...o, [selId]: outcome }));
      setEditing(false);
      showToast("처리 내용을 수정했습니다");
      updateReportResolution(selId, {
        targetType: sel.type,
        targetId: sel.targetId,
        authorId: sel.authorId,
        prevDeactivated: sel.postDeactivated ?? false,
        deactivatePost: deactivate,
        prevSanction: sel.sanctionType ?? null,
        sanction,
      }).catch(() => showToast("저장 실패 — 새로고침 후 다시 시도해주세요"));
    } else {
      setOverrides((o) => ({ ...o, [selId]: "resolved" }));
      setOutcomes((o) => ({ ...o, [selId]: outcome }));
      setSelId(null);
      showToast(
        parts.length
          ? `처리완료 — ${parts.join(" · ")}`
          : "신고를 처리완료했습니다",
      );
      resolveReport(selId, {
        targetType: sel.type,
        targetId: sel.targetId,
        authorId: sel.authorId,
        deactivatePost: deactivate,
        sanction,
      }).catch(() => showToast("저장 실패 — 새로고침 후 다시 시도해주세요"));
    }
  }
  function dismiss() {
    if (selId == null) return;
    setOverrides((o) => ({ ...o, [selId]: "dismissed" }));
    setOutcomes((o) => ({
      ...o,
      [selId]: {
        deactivated: false,
        sanctionLabel: "",
        target: "",
        resolvedDate: new Date().toISOString().split("T")[0],
      },
    }));
    setSelId(null);
    showToast("신고를 무시 처리했습니다");
    dismissReport(selId).catch(() =>
      showToast("저장 실패 — 새로고침 후 다시 시도해주세요"),
    );
  }

  const sanctions: { key: Sanction; label: string }[] = [
    { key: "none", label: "제재 없음" },
    { key: "7d", label: "7일 정지" },
    { key: "30d", label: "30일 정지" },
    { key: "perm", label: "영구 정지" },
  ];
  function sanctionClass(key: Sanction) {
    const base =
      "flex-1 whitespace-nowrap rounded-[9px] border px-1.5 py-[9px] text-center text-[12.5px] font-bold ";
    if (sanction !== key)
      return base + "border-[#e7ebee] bg-white text-slate-500";
    if (key === "none")
      return base + "border-slate-300 bg-slate-100 text-slate-700";
    if (key === "perm") return base + "border-red-500 bg-red-500 text-white";
    return base + "border-orange-400 bg-orange-50 text-orange-700";
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
              신고 내역
            </h1>
          </div>
          <p className="mt-2 text-[15px] text-slate-500">
            접수된 신고를 검토하고 처리하세요
          </p>
        </div>
        <div className="whitespace-nowrap rounded-[11px] border border-[#e7ebee] bg-white px-[14px] py-[9px] text-[13px] font-medium text-slate-500">
          총 <span className="font-bold text-slate-900">{totalCount}</span>건 ·{" "}
          <span className="font-bold text-red-600">{pendingCount}</span>건
          대기중
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
          placeholder="신고 대상, 사유로 검색..."
          className="flex-1 border-none bg-transparent text-[14px] text-slate-900 outline-none"
        />
      </div>

      
      <div className="flex flex-wrap gap-7 rounded-2xl border border-[#e7ebee] bg-white px-[22px] py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div>
          <div className="mb-2.5 text-[13px] font-bold text-slate-600">
            신고 유형
          </div>
          <div className="inline-flex gap-1 rounded-[11px] bg-slate-100 p-1">
            <SegButton
              active={type === "all"}
              onClick={() => setFilter(() => setType("all"))}
            >
              전체
            </SegButton>
            <SegButton
              active={type === "post"}
              onClick={() => setFilter(() => setType("post"))}
            >
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-[15px] w-[15px]" />
                게시글
              </span>
            </SegButton>
            <SegButton
              active={type === "user"}
              onClick={() => setFilter(() => setType("user"))}
            >
              <span className="inline-flex items-center gap-1.5">
                <User className="h-[15px] w-[15px]" />
                유저
              </span>
            </SegButton>
          </div>
        </div>
        <div>
          <div className="mb-2.5 text-[13px] font-bold text-slate-600">
            처리 상태
          </div>
          <div className="inline-flex gap-1 rounded-[11px] bg-slate-100 p-1">
            <SegButton
              active={status === "all"}
              onClick={() => setFilter(() => setStatus("all"))}
            >
              전체
            </SegButton>
            <SegButton
              active={status === REPORT_STATUS.PENDING}
              onClick={() => setFilter(() => setStatus(REPORT_STATUS.PENDING))}
            >
              대기중
            </SegButton>
            <SegButton
              active={status === REPORT_STATUS.RESOLVED}
              onClick={() => setFilter(() => setStatus(REPORT_STATUS.RESOLVED))}
            >
              처리완료
            </SegButton>
            <SegButton
              active={status === REPORT_STATUS.DISMISSED}
              onClick={() => setFilter(() => setStatus(REPORT_STATUS.DISMISSED))}
            >
              무시됨
            </SegButton>
          </div>
        </div>
      </div>

      
      <div className="overflow-hidden rounded-[18px] border border-[#e7ebee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-[#f1f4f6] bg-slate-50">
                {["유형", "대상", "신고 사유", "신고일", "상태"].map((h) => (
                  <th
                    key={h}
                    className="px-[18px] py-[13px] text-left text-[12px] font-bold uppercase tracking-wide text-slate-400"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-[18px] py-[13px] text-right text-[12px] font-bold uppercase tracking-wide text-slate-400">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => {
                const reason = REASON_STYLE[r.reason] ?? REASON_STYLE["기타"];
                const st = STATUS_STYLE[r.status];
                const cat = r.category ? CATEGORY_STYLE[r.category] : null;
                const isPending = r.status === REPORT_STATUS.PENDING;
                return (
                  <tr
                    key={r.id}
                    onClick={() => openDrawer(r.id)}
                    className="cursor-pointer border-t border-[#f3f5f7] hover:bg-slate-50"
                  >
                    <td className="px-[18px] py-[15px]">
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            color: r.type === "post" ? "#0d9488" : "#8b5cf6",
                          }}
                          className="flex"
                        >
                          {r.type === "post" ? (
                            <FileText className="h-[17px] w-[17px]" />
                          ) : (
                            <User className="h-[17px] w-[17px]" />
                          )}
                        </span>
                        <span className="whitespace-nowrap text-[13.5px] font-semibold text-slate-600">
                          {r.type === "post" ? "게시글" : "유저"}
                        </span>
                      </div>
                    </td>
                    <td className="px-[18px] py-[15px]">
                      <div className="min-w-0">
                        <div className="max-w-[320px] truncate text-[14px] font-bold text-slate-900">
                          {r.targetName}
                        </div>
                        {cat && (
                          <span
                            className="mt-[5px] inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                            style={{ background: cat.bg, color: cat.fg }}
                          >
                            {r.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-[18px] py-[15px]">
                      <Pill text={r.reason} fg={reason.fg} bg={reason.bg} />
                    </td>
                    <td className="whitespace-nowrap px-[18px] py-[15px] text-[13.5px] text-slate-500">
                      {r.reportDate}
                    </td>
                    <td className="px-[18px] py-[15px]">
                      <Pill text={st.label} fg={st.fg} bg={st.bg} bold />
                    </td>
                    <td className="px-[18px] py-[15px]">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(r.id);
                          }}
                          className={[
                            "whitespace-nowrap rounded-[9px] px-4 py-2 text-[13px]",
                            isPending
                              ? "border-none bg-teal-500 font-bold text-white"
                              : "border border-[#e2e8eb] bg-white font-semibold text-slate-600",
                          ].join(" ")}
                        >
                          {isPending ? "검토" : "상세"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        
        {pageItems.length > 0 && (
          <div className="lg:hidden divide-y divide-[#f3f5f7]">
            {pageItems.map((r) => {
              const reason = REASON_STYLE[r.reason] ?? REASON_STYLE["기타"];
              const st = STATUS_STYLE[r.status];
              const isPending = r.status === REPORT_STATUS.PENDING;
              return (
                <div
                  key={r.id}
                  onClick={() => openDrawer(r.id)}
                  className="cursor-pointer px-4 py-3.5 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        style={{ color: r.type === "post" ? "#0d9488" : "#8b5cf6" }}
                        className="flex shrink-0"
                      >
                        {r.type === "post" ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </span>
                      <span className="truncate text-[14px] font-bold text-slate-900">
                        {r.targetName}
                      </span>
                    </div>
                    <Pill text={st.label} fg={st.fg} bg={st.bg} bold />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Pill text={r.reason} fg={reason.fg} bg={reason.bg} />
                      <span className="text-[12.5px] text-slate-400">{r.reportDate}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); openDrawer(r.id); }}
                      className={[
                        "shrink-0 rounded-[9px] px-3.5 py-1.5 text-[12px]",
                        isPending
                          ? "bg-teal-500 font-bold text-white"
                          : "border border-[#e2e8eb] bg-white font-semibold text-slate-600",
                      ].join(" ")}
                    >
                      {isPending ? "검토" : "상세"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Flag className="h-12 w-12 text-slate-200" strokeWidth={1.8} />
            <div className="mt-4 text-[15px] font-bold text-slate-500">
              조건에 맞는 신고가 없습니다
            </div>
            <div className="mt-[5px] text-[13.5px] text-slate-400">
              필터를 변경하거나 검색어를 지워보세요
            </div>
          </div>
        )}

        
        {totalPages > 1 && (
          <AdminPagination
            currentPage={curPage}
            totalPages={totalPages}
            onPageChange={setPage}
            countLabel={<>총 <span className="font-semibold text-slate-600">{filtered.length}</span>건 중 <span className="font-semibold text-slate-600">{filtered.length === 0 ? "0" : `${startIdx + 1}–${startIdx + pageItems.length}`}</span> 표시</>}
          />
        )}
      </div>

      
      {sel && (
        <>
          <div
            onClick={() => setSelId(null)}
            className="fixed inset-0 z-[70] bg-slate-900/45"
            style={{ animation: "fadeIn .18s ease" }}
          />
          <div
            className="fixed right-0 top-0 z-[71] flex h-screen w-[460px] max-w-full flex-col bg-white shadow-[-12px_0_44px_rgba(15,23,42,0.18)]"
            style={{ animation: "drawerIn .26s cubic-bezier(.4,0,.2,1)" }}
          >
            
            <div className="flex items-center justify-between gap-3 border-b border-[#f1f4f6] px-6 py-[22px]">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
                  신고 상세
                </h2>
                <span className="text-[12.5px] font-semibold text-slate-400">
                  #{sel.id}
                </span>
              </div>
              <button
                onClick={() => setSelId(null)}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#eef1f3] bg-white text-slate-500 hover:bg-slate-100"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </button>
            </div>

            
            <div className="flex-1 overflow-y-auto overscroll-contain p-6">
              {(() => {
                const reason = REASON_STYLE[sel.reason] ?? REASON_STYLE["기타"];
                const st = STATUS_STYLE[sel.status];
                const cat = sel.category ? CATEGORY_STYLE[sel.category] : null;
                return (
                  <>
                    <div className="mb-5 flex items-center gap-2">
                      <Pill text={st.label} fg={st.fg} bg={st.bg} bold />
                      <Pill text={sel.reason} fg={reason.fg} bg={reason.bg} />
                    </div>

                    
                    <div className="mb-5 rounded-[14px] border border-[#eef1f3] bg-slate-50 p-[18px]">
                      <div className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">
                        <span
                          style={{
                            color: sel.type === "post" ? "#0d9488" : "#8b5cf6",
                          }}
                          className="flex"
                        >
                          {sel.type === "post" ? (
                            <FileText className="h-[17px] w-[17px]" />
                          ) : (
                            <User className="h-[17px] w-[17px]" />
                          )}
                        </span>
                        {sel.type === "post" ? "게시글" : "유저"} 신고 대상
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15.5px] font-bold text-slate-900">
                          {sel.targetName}
                        </div>
                        {cat && (
                          <span
                            className="mt-1.5 inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                            style={{ background: cat.bg, color: cat.fg }}
                          >
                            {sel.category}
                          </span>
                        )}
                      </div>
                      {sel.type === "user" ? (
                        <Link
                          href={`/admin/users/${sel.targetId}`}
                          target="_blank"
                          className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange-500"
                        >
                          유저 프로필 보기
                          <ExternalLink
                            className="h-[14px] w-[14px]"
                            strokeWidth={2.2}
                          />
                        </Link>
                      ) : (() => {
                        const postUrl = sel.postType
                          ? getPostDetailUrl(sel.postType, sel.targetId)
                          : null;
                        return postUrl ? (
                          <Link
                            href={postUrl}
                            target="_blank"
                            className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange-500"
                          >
                            원본 게시글 보기
                            <ExternalLink
                              className="h-[14px] w-[14px]"
                              strokeWidth={2.2}
                            />
                          </Link>
                        ) : (
                          <span className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-400">
                            원본 게시글 보기
                            <ExternalLink
                              className="h-[14px] w-[14px]"
                              strokeWidth={2.2}
                            />
                          </span>
                        );
                      })()}
                    </div>

                    
                    <div className="mb-5">
                      <div className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">
                        신고 내용
                      </div>
                      <p className="rounded-xl border border-[#eef1f3] bg-white p-[15px] text-[14px] leading-relaxed text-slate-700">
                        {sel.description || "추가 내용 없음"}
                      </p>
                    </div>

                    
                    <div className="mb-6 overflow-hidden rounded-xl border border-[#eef1f3]">
                      {sel.type === "post" && (
                        <div className="flex items-center justify-between border-b border-[#f3f5f7] px-4 py-[11px]">
                          <span className="text-[13px] text-slate-400">
                            작성자
                          </span>
                          <span className="text-[13px] font-bold text-slate-900">
                            {sel.author}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between px-4 py-[11px]">
                        <span className="text-[13px] text-slate-400">
                          신고일
                        </span>
                        <span className="text-[13px] font-semibold text-slate-900">
                          {sel.reportDate}
                        </span>
                      </div>
                    </div>

                    
                    {sel.status !== REPORT_STATUS.PENDING &&
                      !editing &&
                      (() => {
                        const localOc = outcomes[sel.id];
                        const dbSanctionLabel =
                          sel.sanctionType && sel.sanctionType !== "none"
                            ? (SANCTION_LABEL[
                                sel.sanctionType as Exclude<Sanction, "none">
                              ] ?? "")
                            : "";
                        const oc: Outcome = localOc ?? {
                          deactivated: sel.postDeactivated ?? false,
                          sanctionLabel: dbSanctionLabel,
                          target: sanctionTarget ?? "",
                          resolvedDate:
                            sel.resolvedAt?.split("T")[0] ?? "",
                        };
                        const isResolved = sel.status === "resolved";
                        const noAction = !oc.deactivated && !oc.sanctionLabel;
                        const perm = oc.sanctionLabel === "영구 정지";
                        const sancBg = perm ? "#fef2f2" : "#fff7ed";
                        const sancFg = perm ? "#dc2626" : "#c2410c";
                        const sancBorder = perm ? "#fecaca" : "#fed7aa";
                        return (
                          <div className="mb-2 overflow-hidden rounded-[14px] border border-[#eef1f3]">
                            <div className="flex items-center gap-2 border-b border-[#f1f4f6] bg-slate-50 px-4 py-[13px]">
                              <span
                                style={{
                                  color: isResolved ? "#059669" : "#94a3b8",
                                }}
                                className="flex"
                              >
                                {isResolved ? (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                )}
                              </span>
                              <span className="text-[13px] font-extrabold text-slate-900">
                                {isResolved ? "처리 결과" : "무시 처리됨"}
                              </span>
                              <span className="ml-auto text-[12px] text-slate-400">
                                {oc.resolvedDate}
                              </span>
                              {isResolved && (
                                <button
                                  onClick={startEdit}
                                  className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8eb] bg-white px-[11px] py-[5px] text-[12.5px] font-bold text-slate-600 hover:bg-slate-100"
                                >
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                                  </svg>
                                  수정
                                </button>
                              )}
                            </div>
                            <div className="flex flex-col gap-2.5 px-4 py-3.5">
                              {sel.handledBy && (
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px] bg-slate-100">
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#64748b"
                                      strokeWidth="2.4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                  </span>
                                  <span className="text-[13.5px] text-slate-700">
                                    처리 관리자:{" "}
                                    <span className="font-bold text-slate-900">
                                      {sel.handledBy}
                                    </span>
                                  </span>
                                </div>
                              )}
                              {oc.deactivated && (
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px] bg-orange-50">
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#ea580c"
                                      strokeWidth="2.4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
                                      <line x1="12" y1="2" x2="12" y2="12" />
                                    </svg>
                                  </span>
                                  <span className="text-[13.5px] text-slate-700">
                                    게시글이{" "}
                                    <span className="font-bold text-orange-700">
                                      비활성화
                                    </span>
                                    되었습니다
                                  </span>
                                </div>
                              )}
                              {oc.sanctionLabel && (
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px]"
                                    style={{ background: sancBg }}
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke={sancFg}
                                      strokeWidth="2.4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="10" />
                                      <line
                                        x1="4.93"
                                        y1="4.93"
                                        x2="19.07"
                                        y2="19.07"
                                      />
                                    </svg>
                                  </span>
                                  <span className="text-[13.5px] text-slate-700">
                                    <span className="font-bold text-slate-900">
                                      {oc.target}
                                    </span>{" "}
                                    계정{" "}
                                    <span
                                      className="rounded-full border px-2 py-0.5 text-[12px] font-bold"
                                      style={{
                                        background: sancBg,
                                        color: sancFg,
                                        borderColor: sancBorder,
                                      }}
                                    >
                                      {oc.sanctionLabel}
                                    </span>
                                  </span>
                                </div>
                              )}
                              {isResolved && noAction && (
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px] bg-emerald-50">
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#059669"
                                      strokeWidth="2.4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </span>
                                  <span className="text-[13.5px] text-slate-700">
                                    신고를 확인하고{" "}
                                    <span className="font-bold text-green-700">
                                      처리완료
                                    </span>{" "}
                                    처리했습니다 (추가 조치 없음)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                    
                    {(() => {
                      type LogEntry = { key: string; color: string; bg: string; label: string; by: string | null; at: string | null };
                      const logs: LogEntry[] = [];

                      logs.push({
                        key: "created",
                        color: "#64748b", bg: "#f1f5f9",
                        label: "신고 접수",
                        by: null,
                        at: sel.createdAt ?? sel.reportDate,
                      });

                      if (sel.status !== "pending") {
                        if (sel.status === "dismissed") {
                          logs.push({ key: "dismissed", color: "#64748b", bg: "#f1f5f9", label: "신고 무시 처리", by: sel.handledBy ?? null, at: sel.resolvedAt ?? null });
                        } else {
                          const hasAction = sel.postDeactivated || (sel.sanctionType && sel.sanctionType !== "none");
                          if (sel.postDeactivated) {
                            logs.push({ key: "deactivate", color: "#f97316", bg: "#fff7ed", label: "게시글 비공개 처리", by: sel.handledBy ?? null, at: sel.resolvedAt ?? null });
                          }
                          if (sel.sanctionType && sel.sanctionType !== "none") {
                            const sLabel = SANCTION_LABEL[sel.sanctionType as Exclude<Sanction,"none">];
                            const isPerm = sel.sanctionType === "perm";
                            logs.push({ key: "sanction", color: isPerm ? "#dc2626" : "#c2410c", bg: isPerm ? "#fef2f2" : "#fff7ed", label: `유저 ${sLabel}`, by: sel.handledBy ?? null, at: sel.resolvedAt ?? null });
                          }
                          if (!hasAction) {
                            logs.push({ key: "resolved", color: "#059669", bg: "#ecfdf5", label: "처리완료 (조치 없음)", by: sel.handledBy ?? null, at: sel.resolvedAt ?? null });
                          }
                        }
                      }

                      return (
                        <div className="mb-6 overflow-hidden rounded-[14px] border border-[#eef1f3]">
                          <div className="flex items-center gap-2 border-b border-[#f1f4f6] bg-slate-50 px-4 py-[13px]">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            <span className="text-[13px] font-extrabold text-slate-900">처리 로그</span>
                            <span className="ml-auto text-[11.5px] font-bold text-indigo-500 bg-indigo-50 rounded-full px-2.5 py-0.5">{logs.length}건</span>
                          </div>
                          <div className="divide-y divide-[#f3f5f7]">
                            {logs.map((log) => (
                              <div key={log.key} className="flex items-start gap-3 px-4 py-[13px]">
                                <span className="mt-0.5 flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: log.bg, color: log.color }}>
                                  {log.key === "created" ? "접" : log.key === "dismissed" ? "무" : log.key === "resolved" ? "✓" : "✕"}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] font-bold" style={{ color: log.color }}>{log.label}</div>
                                  <div className="mt-0.5 flex flex-wrap gap-2 text-[12px] text-slate-400">
                                    {log.by && <span>처리: <span className="font-semibold text-slate-600">{log.by}</span></span>}
                                    {log.at && <span>{formatDateTime(log.at)}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    
                    {(selIsPending || editing) && (
                      <>
                        {editing && (
                          <div className="mb-3.5 flex items-center gap-1.5 rounded-[10px] border border-blue-100 bg-blue-50 px-[13px] py-[9px]">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
                            </svg>
                            <span className="text-[12.5px] font-bold text-blue-700">
                              처리 내용을 수정하고 있습니다
                            </span>
                          </div>
                        )}
                        {sel.type === "post" && (
                          <div className="mb-[18px]">
                            <div className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">
                              게시글 조치
                            </div>
                            <label
                              onClick={() => setDeactivate((v) => !v)}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border p-[15px]"
                              style={{
                                borderColor: deactivate ? "#99f6e4" : "#e7ebee",
                                background: deactivate ? "#f0fdfa" : "#f8fafc",
                              }}
                            >
                              <div
                                className="mt-px flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2"
                                style={{
                                  borderColor: deactivate
                                    ? "#14b8a6"
                                    : "#cbd5e1",
                                  background: deactivate ? "#14b8a6" : "#fff",
                                }}
                              >
                                {deactivate && (
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#fff"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <div className="text-[14px] font-bold text-slate-900">
                                  게시글 비활성화
                                </div>
                                <div className="mt-[3px] text-[12.5px] text-slate-500">
                                  다른 사용자에게 노출이 중단됩니다
                                </div>
                              </div>
                            </label>
                          </div>
                        )}
                        <div className="mb-1">
                          <div className="mb-2.5 flex items-center gap-2">
                            <span className="text-[12px] font-bold uppercase tracking-wide text-slate-400">
                              {sel.type === "post" ? "작성자" : "대상 유저"}{" "}
                              제재
                            </span>
                            <span className="text-[12.5px] font-bold text-slate-600">
                              {sanctionTarget}
                            </span>
                          </div>
                          <div className="flex gap-[7px]">
                            {sanctions.map((s) => (
                              <button
                                key={s.key}
                                onClick={() => setSanction(s.key)}
                                className={sanctionClass(s.key)}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            
            <div className="border-t border-[#f1f4f6] px-6 py-[18px]">
              {editing ? (
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 rounded-[11px] border border-[#e2e8eb] bg-slate-50 py-[13px] text-[14px] font-bold text-slate-600 hover:bg-slate-100"
                  >
                    취소
                  </button>
                  <button
                    onClick={resolve}
                    className="flex-[1.4] rounded-[11px] bg-teal-500 py-[13px] text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)] hover:bg-teal-600"
                  >
                    수정 저장
                  </button>
                </div>
              ) : selIsPending ? (
                <div className="flex gap-2.5">
                  <button
                    onClick={dismiss}
                    className="flex-1 rounded-[11px] border border-[#e2e8eb] bg-slate-50 py-[13px] text-[14px] font-bold text-slate-600 hover:bg-slate-100"
                  >
                    신고 무시
                  </button>
                  <button
                    onClick={resolve}
                    className="flex-[1.4] rounded-[11px] bg-teal-500 py-[13px] text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)] hover:bg-teal-600"
                  >
                    처리완료
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-[11px] bg-slate-50 py-[11px] text-[13.5px] font-semibold text-slate-500">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {sel.status === "resolved"
                    ? "처리완료된 신고입니다"
                    : "무시 처리된 신고입니다"}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      
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
