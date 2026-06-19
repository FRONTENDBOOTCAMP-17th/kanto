"use client";

import { useMemo, useState, useTransition } from "react";
import { FileText, ExternalLink, X } from "lucide-react";
import {
  AdminPost,
  POST_TYPE_LABEL,
  getPostDetailUrl,
} from "@/services/admin/adminPosts";
import AdminPostsTable from "./AdminPostsTable";
import { togglePostStatus } from "@/app/(admin)/admin/posts/_actions/togglePostStatus";
import {
  getPostReports,
  type PostReport,
} from "@/app/(admin)/admin/posts/_actions/getPostReports";

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

const CATEGORY_STYLE: Record<string, { bg: string; fg: string }> = {
  used_goods: { bg: "#f0fdfa", fg: "#0d9488" },
  jobs: { bg: "#faf5ff", fg: "#7c3aed" },
  rental: { bg: "#eff6ff", fg: "#2563eb" },
  community: { bg: "#fff7ed", fg: "#c2410c" },
};

const POST_STATUS_STYLE: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  active: { label: "활성", bg: "#ecfdf5", fg: "#059669" },
  inactive: { label: "비공개", bg: "#f1f5f9", fg: "#94a3b8" },
};

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

function formatDateTime(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(date));
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

export default function AdminPostsClient({ posts }: AdminPostsClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState(posts);
  const [selId, setSelId] = useState<number | null>(null);
  const [postReports, setPostReports] = useState<PostReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [isPending, startTransition] = useTransition();

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(""), 2600);
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
  const isActive = sel?.status === "active";
  const catStyle = sel
    ? (CATEGORY_STYLE[sel.post_type] ?? { bg: "#f1f5f9", fg: "#64748b" })
    : null;
  const stStyle = sel
    ? (POST_STATUS_STYLE[sel.status] ?? { label: sel.status, bg: "#f1f5f9", fg: "#64748b" })
    : null;
  const postUrl = sel ? getPostDetailUrl(sel.post_type, sel.id) : null;

  function handleToggle() {
    if (!sel) return;
    const nextStatus = sel.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      await togglePostStatus(sel.id, nextStatus as "active" | "inactive");
      setItems((prev) =>
        prev.map((p) => (p.id === sel.id ? { ...p, status: nextStatus } : p)),
      );
      setSelId(null);
      showToast(
        nextStatus === "active"
          ? "게시글을 활성화했습니다"
          : "게시글을 비공개 처리했습니다",
      );
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

      {/* Search */}
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

      {/* Filters */}
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

      {/* Table */}
      <div className="overflow-hidden rounded-[18px] border border-[#e7ebee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="overflow-x-auto">
          <AdminPostsTable
          posts={pageItems}
          onOpen={(id) => {
            setSelId(id);
            setPostReports([]);
            setReportsLoading(true);
            getPostReports(id).then((r) => {
              setPostReports(r);
              setReportsLoading(false);
            });
          }}
        />
        </div>

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <FileText
              className="h-12 w-12 text-slate-200"
              strokeWidth={1.8}
            />
            <div className="mt-4 text-[15px] font-bold text-slate-500">
              조건에 맞는 게시글이 없습니다
            </div>
            <div className="mt-[5px] text-[13.5px] text-slate-400">
              필터를 변경하거나 검색어를 지워보세요
            </div>
          </div>
        )}

        {/* Pagination */}
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

      {/* Drawer */}
      {sel && stStyle && catStyle && (
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
            {/* header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#f1f4f6] px-6 py-[22px]">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
                  게시글 상세
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

            {/* body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-6">
              {/* status + category pills */}
              <div className="mb-5 flex items-center gap-2">
                <Pill
                  text={stStyle.label}
                  fg={stStyle.fg}
                  bg={stStyle.bg}
                  bold
                />
                <Pill
                  text={POST_TYPE_LABEL[sel.post_type] ?? sel.post_type}
                  fg={catStyle.fg}
                  bg={catStyle.bg}
                />
              </div>

              {/* post preview */}
              <div className="mb-5 rounded-[14px] border border-[#eef1f3] bg-slate-50 p-[18px]">
                <div className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">
                  <FileText
                    className="h-[17px] w-[17px] text-teal-600"
                    strokeWidth={2}
                  />
                  게시글
                </div>
                <div className="text-[15.5px] font-bold text-slate-900">
                  {sel.title}
                </div>
                {postUrl && (
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange-500"
                  >
                    원본 게시글 보기
                    <ExternalLink
                      className="h-[14px] w-[14px]"
                      strokeWidth={2.2}
                    />
                  </a>
                )}
              </div>

              {/* meta */}
              <div className="overflow-hidden rounded-xl border border-[#eef1f3]">
                <div className="flex items-center justify-between border-b border-[#f3f5f7] px-4 py-[11px]">
                  <span className="text-[13px] text-slate-400">작성자</span>
                  <span className="text-[13px] font-bold text-slate-900">
                    {sel.author_name ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#f3f5f7] px-4 py-[11px]">
                  <span className="text-[13px] text-slate-400">조회수</span>
                  <span className="text-[13px] font-semibold text-slate-900">
                    {(sel.view_count ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className={`flex items-center justify-between px-4 py-[11px]${sel.handled_by_name ? " border-b border-[#f3f5f7]" : ""}`}>
                  <span className="text-[13px] text-slate-400">작성일</span>
                  <span className="text-[13px] font-semibold text-slate-900">
                    {formatDate(sel.created_at)}
                  </span>
                </div>
                {sel.handled_by_name && (
                  <div className={`flex items-center justify-between px-4 py-[11px]${sel.handled_at ? " border-b border-[#f3f5f7]" : ""}`}>
                    <span className="text-[13px] text-slate-400">처리 관리자</span>
                    <span className="text-[13px] font-bold text-slate-900">
                      {sel.handled_by_name}
                    </span>
                  </div>
                )}
                {sel.handled_at && (
                  <div className="flex items-center justify-between px-4 py-[11px]">
                    <span className="text-[13px] text-slate-400">처리 일시</span>
                    <span className="text-[13px] font-semibold text-slate-900">
                      {formatDate(sel.handled_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* 신고 내역 */}
              <div className="mt-5 overflow-hidden rounded-[14px] border border-[#eef1f3]">
                <div className="flex items-center gap-2 border-b border-[#f1f4f6] bg-slate-50 px-4 py-[13px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span className="text-[13px] font-extrabold text-slate-900">신고 누적</span>
                  {!reportsLoading && (
                    <span className={[
                      "ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold",
                      postReports.length > 0 ? "bg-orange-50 text-orange-600" : "bg-slate-100 text-slate-400",
                    ].join(" ")}>
                      {postReports.length}건
                    </span>
                  )}
                </div>
                {reportsLoading ? (
                  <div className="px-4 py-5 text-[13px] text-slate-400">불러오는 중...</div>
                ) : postReports.length === 0 ? (
                  <div className="px-4 py-5 text-[13px] text-slate-400">신고 내역이 없습니다</div>
                ) : (
                  <div className="divide-y divide-[#f3f5f7]">
                    {postReports.map((r) => {
                      const statusStyle: Record<string, { label: string; bg: string; fg: string }> = {
                        pending: { label: "대기중", bg: "#fef9c3", fg: "#a16207" },
                        resolved: { label: "처리완료", bg: "#dcfce7", fg: "#15803d" },
                        dismissed: { label: "무시됨", bg: "#f1f5f9", fg: "#64748b" },
                      };
                      const sanctionLabel: Record<string, string> = {
                        "7d": "7일 정지", "30d": "30일 정지", perm: "영구 정지",
                      };
                      const ss = statusStyle[r.status] ?? statusStyle.pending;
                      return (
                        <div key={r.id} className="px-4 py-[13px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            {r.reason && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-semibold text-slate-600">
                                {r.reason}
                              </span>
                            )}
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                              style={{ background: ss.bg, color: ss.fg }}
                            >
                              {ss.label}
                            </span>
                            {r.sanction_type && (
                              <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11.5px] font-bold text-orange-600">
                                {sanctionLabel[r.sanction_type] ?? r.sanction_type}
                              </span>
                            )}
                          </div>
                          {(r.admin_name || r.resolved_at) && (
                            <div className="mt-1.5 flex flex-col gap-0.5 text-[12px] text-slate-400">
                              {r.admin_name && <span>처리: <span className="font-semibold text-slate-600">{r.admin_name}</span></span>}
                              {r.resolved_at && <span>{formatDateTime(r.resolved_at)}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 제재 로그 */}
              {(() => {
                const SANCTION_LABEL: Record<string, string> = {
                  "7d": "유저 7일 정지",
                  "30d": "유저 30일 정지",
                  perm: "유저 영구 정지",
                };

                type LogEntry = {
                  key: string;
                  icon: "deactivate" | "sanction" | "activate";
                  label: string;
                  admin: string | null;
                  date: string | null;
                };

                const logs: LogEntry[] = [];

                for (const r of postReports) {
                  if (r.status !== "resolved") continue;
                  if (r.post_deactivated) {
                    logs.push({
                      key: `${r.id}-deactivate`,
                      icon: "deactivate",
                      label: "게시글 비공개 처리",
                      admin: r.admin_name,
                      date: r.resolved_at,
                    });
                  }
                  if (r.sanction_type) {
                    logs.push({
                      key: `${r.id}-sanction`,
                      icon: "sanction",
                      label: SANCTION_LABEL[r.sanction_type] ?? r.sanction_type,
                      admin: r.admin_name,
                      date: r.resolved_at,
                    });
                  }
                }

                if (sel.handled_by_name && sel.handled_at) {
                  const alreadyCovered = logs.some(
                    (l) => l.icon === "deactivate" && l.admin === sel.handled_by_name,
                  );
                  if (!alreadyCovered) {
                    logs.push({
                      key: "direct-toggle",
                      icon: sel.status === "inactive" ? "deactivate" : "activate",
                      label:
                        sel.status === "inactive"
                          ? "게시글 비공개 처리"
                          : "게시글 활성화",
                      admin: sel.handled_by_name,
                      date: sel.handled_at,
                    });
                  }
                }

                logs.sort((a, b) =>
                  (b.date ?? "").localeCompare(a.date ?? ""),
                );

                return (
                  <div className="mt-5 overflow-hidden rounded-[14px] border border-[#eef1f3]">
                    <div className="flex items-center gap-2 border-b border-[#f1f4f6] bg-slate-50 px-4 py-[13px]">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      <span className="text-[13px] font-extrabold text-slate-900">
                        제재 로그
                      </span>
                      {!reportsLoading && (
                        <span
                          className={[
                            "ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold",
                            logs.length > 0
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-slate-100 text-slate-400",
                          ].join(" ")}
                        >
                          {logs.length}건
                        </span>
                      )}
                    </div>
                    {reportsLoading ? (
                      <div className="px-4 py-5 text-[13px] text-slate-400">
                        불러오는 중...
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="px-4 py-5 text-[13px] text-slate-400">
                        제재 이력이 없습니다
                      </div>
                    ) : (
                      <div className="divide-y divide-[#f3f5f7]">
                        {logs.map((log) => {
                          const iconColor =
                            log.icon === "activate"
                              ? "#059669"
                              : log.icon === "sanction"
                                ? "#dc2626"
                                : "#f97316";
                          const bgColor =
                            log.icon === "activate"
                              ? "#ecfdf5"
                              : log.icon === "sanction"
                                ? "#fef2f2"
                                : "#fff7ed";
                          return (
                            <div
                              key={log.key}
                              className="flex items-start gap-3 px-4 py-[13px]"
                            >
                              <span
                                className="mt-0.5 flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                                style={{ background: bgColor, color: iconColor }}
                              >
                                {log.icon === "activate" ? "✓" : "✕"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-[13px] font-bold"
                                  style={{ color: iconColor }}
                                >
                                  {log.label}
                                </div>
                                <div className="mt-0.5 flex flex-wrap gap-2 text-[12px] text-slate-400">
                                  {log.admin && (
                                    <span>
                                      처리:{" "}
                                      <span className="font-semibold text-slate-600">
                                        {log.admin}
                                      </span>
                                    </span>
                                  )}
                                  {log.date && (
                                    <span>{formatDateTime(log.date)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* footer */}
            <div className="border-t border-[#f1f4f6] px-6 py-[18px]">
              {isActive ? (
                <div className="flex gap-2.5">
                  <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className="flex-1 rounded-[11px] border border-[#e2e8eb] bg-slate-50 py-[13px] text-[14px] font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    비공개 처리
                  </button>
                  <button
                    onClick={() => setSelId(null)}
                    className="flex-[1.4] rounded-[11px] border border-[#e2e8eb] bg-white py-[13px] text-[14px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    닫기
                  </button>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className="flex-1 rounded-[11px] bg-teal-500 py-[13px] text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)] hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    활성화
                  </button>
                  <button
                    onClick={() => setSelId(null)}
                    className="flex-[1.4] rounded-[11px] border border-[#e2e8eb] bg-white py-[13px] text-[14px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast */}
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
