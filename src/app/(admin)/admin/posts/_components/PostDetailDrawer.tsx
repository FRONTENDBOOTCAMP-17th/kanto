"use client";

import { useEffect, useState, useTransition } from "react";
import { FileText, ExternalLink, X } from "lucide-react";
import {
  AdminPost,
  POST_TYPE_LABEL,
  getPostDetailUrl,
} from "@/services/admin/adminPosts";
import { togglePostStatus } from "@/app/(admin)/admin/posts/_actions/togglePostStatus";
import { deletePost } from "@/app/(admin)/admin/posts/_actions/deletePost";
import { resolvePostReports } from "@/app/(admin)/admin/posts/_actions/resolvePostReports";
import {
  getPostReports,
  type PostReport,
} from "@/app/(admin)/admin/posts/_actions/getPostReports";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { SANCTION_LABEL } from "@/app/(admin)/admin/reports/_lib/constants";
import { formatDate, formatDateTime } from "@/utils/formatTime";

const CATEGORY_STYLE: Record<string, { bg: string; fg: string }> = {
  used_goods: { bg: "#f0fdfa", fg: "#0d9488" },
  jobs: { bg: "#faf5ff", fg: "#7c3aed" },
  rental: { bg: "#eff6ff", fg: "#2563eb" },
};

const POST_STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  active: { label: "활성", bg: "#ecfdf5", fg: "#059669" },
  inactive: { label: "비공개", bg: "#f1f5f9", fg: "#94a3b8" },
};


function Pill({ text, fg, bg, bold }: { text: string; fg: string; bg: string; bold?: boolean }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-1 text-[12px]"
      style={{ background: bg, color: fg, fontWeight: bold ? 700 : 600 }}
    >
      {text}
    </span>
  );
}

interface Props {
  post: AdminPost;
  onClose: () => void;
  onChanged?: (postId: number, patch: Partial<AdminPost>) => void;
  onDeleted?: (postId: number) => void;
  onToast?: (msg: string) => void;
}

export default function PostDetailDrawer({ post, onClose, onChanged, onDeleted, onToast }: Props) {
  const [postReports, setPostReports] = useState<PostReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    getPostReports(post.id).then((r) => {
      if (!alive) return;
      setPostReports(r);
      setReportsLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [post.id]);

  const isActive = post.status === "active";
  const catStyle = CATEGORY_STYLE[post.post_type] ?? { bg: "#f1f5f9", fg: "#64748b" };
  const stStyle = POST_STATUS_STYLE[post.status] ?? { label: post.status, bg: "#f1f5f9", fg: "#64748b" };
  const postUrl = getPostDetailUrl(post.post_type, post.id);

  function handleToggle() {
    const nextStatus = post.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      await togglePostStatus(post.id, nextStatus as "active" | "inactive");
      await resolvePostReports(post.id);
      onChanged?.(post.id, { status: nextStatus });
      onClose();
      onToast?.(
        nextStatus === "active"
          ? "게시글을 활성화했습니다"
          : "게시글을 비공개 처리했습니다",
      );
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deletePost(post.id);
        await resolvePostReports(post.id);
        setConfirmDelete(false);
        onDeleted?.(post.id);
        onClose();
        onToast?.("게시글을 삭제했습니다");
      } catch {
        onToast?.("삭제 실패 — 다시 시도해주세요");
      }
    });
  }

  return (
    <>
      <style>{`
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div
        onClick={onClose}
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
              게시글 상세
            </h2>
            <span className="text-[12.5px] font-semibold text-slate-400">#{post.id}</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#eef1f3] bg-white text-slate-500 hover:bg-slate-100"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-6">
          <div className="mb-5 flex items-center gap-2">
            <Pill text={stStyle.label} fg={stStyle.fg} bg={stStyle.bg} bold />
            <Pill text={POST_TYPE_LABEL[post.post_type] ?? post.post_type} fg={catStyle.fg} bg={catStyle.bg} />
            {!isActive && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="ml-auto cursor-pointer text-[13px] font-semibold text-red-500 transition-colors hover:underline"
              >
                삭제
              </button>
            )}
          </div>

          <div className="mb-5 rounded-[14px] border border-[#eef1f3] bg-slate-50 p-[18px]">
            <div className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">
              <FileText className="h-[17px] w-[17px] text-teal-600" strokeWidth={2} />
              게시글
            </div>
            <div className="text-[15.5px] font-bold text-slate-900">{post.title}</div>
            {postUrl && (
              <a
                href={postUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange-500"
              >
                원본 게시글 보기
                <ExternalLink className="h-[14px] w-[14px]" strokeWidth={2.2} />
              </a>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-[#eef1f3]">
            <div className="flex items-center justify-between border-b border-[#f3f5f7] px-4 py-[11px]">
              <span className="text-[13px] text-slate-400">작성자</span>
              <span className="text-[13px] font-bold text-slate-900">{post.author_name ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#f3f5f7] px-4 py-[11px]">
              <span className="text-[13px] text-slate-400">조회수</span>
              <span className="text-[13px] font-semibold text-slate-900">
                {(post.view_count ?? 0).toLocaleString()}
              </span>
            </div>
            <div className={`flex items-center justify-between px-4 py-[11px]${post.handled_by_name ? " border-b border-[#f3f5f7]" : ""}`}>
              <span className="text-[13px] text-slate-400">작성일</span>
              <span className="text-[13px] font-semibold text-slate-900">{formatDate(post.created_at)}</span>
            </div>
            {post.handled_by_name && (
              <div className={`flex items-center justify-between px-4 py-[11px]${post.handled_at ? " border-b border-[#f3f5f7]" : ""}`}>
                <span className="text-[13px] text-slate-400">처리 관리자</span>
                <span className="text-[13px] font-bold text-slate-900">{post.handled_by_name}</span>
              </div>
            )}
            {post.handled_at && (
              <div className="flex items-center justify-between px-4 py-[11px]">
                <span className="text-[13px] text-slate-400">처리 일시</span>
                <span className="text-[13px] font-semibold text-slate-900">{formatDate(post.handled_at)}</span>
              </div>
            )}
          </div>

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
                            {SANCTION_LABEL[r.sanction_type] ?? r.sanction_type}
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

          {(() => {
            const userSanctionLabel: Record<string, string> = {
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
                  label: userSanctionLabel[r.sanction_type] ?? r.sanction_type,
                  admin: r.admin_name,
                  date: r.resolved_at,
                });
              }
            }

            if (post.handled_by_name && post.handled_at) {
              const alreadyCovered = logs.some(
                (l) => l.icon === "deactivate" && l.admin === post.handled_by_name,
              );
              if (!alreadyCovered) {
                logs.push({
                  key: "direct-toggle",
                  icon: post.status === "inactive" ? "deactivate" : "activate",
                  label:
                    post.status === "inactive"
                      ? "게시글 비공개 처리"
                      : "게시글 활성화",
                  admin: post.handled_by_name,
                  date: post.handled_at,
                });
              }
            }

            logs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

            return (
              <div className="mt-5 overflow-hidden rounded-[14px] border border-[#eef1f3]">
                <div className="flex items-center gap-2 border-b border-[#f1f4f6] bg-slate-50 px-4 py-[13px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span className="text-[13px] font-extrabold text-slate-900">제재 로그</span>
                  {!reportsLoading && (
                    <span className={[
                      "ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-bold",
                      logs.length > 0 ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400",
                    ].join(" ")}>
                      {logs.length}건
                    </span>
                  )}
                </div>
                {reportsLoading ? (
                  <div className="px-4 py-5 text-[13px] text-slate-400">불러오는 중...</div>
                ) : logs.length === 0 ? (
                  <div className="px-4 py-5 text-[13px] text-slate-400">제재 이력이 없습니다</div>
                ) : (
                  <div className="divide-y divide-[#f3f5f7]">
                    {logs.map((log) => {
                      const iconColor =
                        log.icon === "activate" ? "#059669" : log.icon === "sanction" ? "#dc2626" : "#f97316";
                      const bgColor =
                        log.icon === "activate" ? "#ecfdf5" : log.icon === "sanction" ? "#fef2f2" : "#fff7ed";
                      return (
                        <div key={log.key} className="flex items-start gap-3 px-4 py-[13px]">
                          <span
                            className="mt-0.5 flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                            style={{ background: bgColor, color: iconColor }}
                          >
                            {log.icon === "activate" ? "✓" : "✕"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold" style={{ color: iconColor }}>
                              {log.label}
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-2 text-[12px] text-slate-400">
                              {log.admin && (
                                <span>처리: <span className="font-semibold text-slate-600">{log.admin}</span></span>
                              )}
                              {log.date && <span>{formatDateTime(log.date)}</span>}
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
                onClick={onClose}
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
                onClick={onClose}
                className="flex-[1.4] rounded-[11px] border border-[#e2e8eb] bg-white py-[13px] text-[14px] font-bold text-slate-600 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        title="게시글을 삭제하시겠습니까?"
        description="삭제된 게시글은 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
