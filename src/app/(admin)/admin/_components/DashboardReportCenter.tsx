"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { X, FileText, User as UserIcon } from "lucide-react";
import type { ReportedUser, ReportedPost } from "@/type/admin";
import type { User } from "@/services/admin/adminUsers";
import { type AdminPost, POST_TYPE_LABEL } from "@/services/admin/adminPosts";
import UserDetailDrawer from "../users/_components/UserDetailDrawer";
import PostDetailDrawer from "../posts/_components/PostDetailDrawer";
import {
  getUserDetailAction,
  getPostDetailAction,
} from "../_actions/getReportDetail";
import { daysSince } from "../_lib/utils";

interface ReportCenter {
  openQueue: () => void;
  openUser: (userId: number) => void;
  openPost: (postId: number) => void;
}

const Ctx = createContext<ReportCenter | null>(null);

export function useReportCenter(): ReportCenter {
  const c = useContext(Ctx);
  if (!c)
    throw new Error("useReportCenter must be used within DashboardReportCenter");
  return c;
}

interface Props {
  reportedUsers: ReportedUser[];
  reportedPosts: ReportedPost[];
  children: ReactNode;
}

export default function DashboardReportCenter({
  reportedUsers,
  reportedPosts,
  children,
}: Props) {
  const router = useRouter();
  const [queueOpen, setQueueOpen] = useState(false);
  const [queueTab, setQueueTab] = useState<"members" | "posts">("members");
  const [userDetail, setUserDetail] = useState<User | null>(null);
  const [postDetail, setPostDetail] = useState<AdminPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [, startTransition] = useTransition();

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as never as { _t: number })._t);
    (showToast as never as { _t: number })._t = window.setTimeout(
      () => setToast(""),
      2600,
    );
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  function openUser(userId: number) {
    setLoading(true);
    getUserDetailAction(userId)
      .then((u) => {
        if (u) setUserDetail(u);
        else showToast("유저 정보를 불러오지 못했습니다");
      })
      .finally(() => setLoading(false));
  }

  function openPost(postId: number) {
    setLoading(true);
    getPostDetailAction(postId)
      .then((p) => {
        if (p) setPostDetail(p);
        else showToast("게시글 정보를 불러오지 못했습니다");
      })
      .finally(() => setLoading(false));
  }

  function openQueue() {
    setQueueOpen(true);
  }

  return (
    <Ctx.Provider value={{ openQueue, openUser, openPost }}>
      <style>{`
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {children}

      {/* 처리 대기열 드로어 (#5) */}
      {queueOpen && (
        <>
          <div
            onClick={() => setQueueOpen(false)}
            className="fixed inset-0 z-[60] bg-slate-900/45"
            style={{ animation: "fadeIn .18s ease" }}
          />
          <div
            className="fixed right-0 top-0 z-[61] flex h-screen w-[460px] max-w-full flex-col bg-white shadow-[-12px_0_44px_rgba(15,23,42,0.18)]"
            style={{ animation: "drawerIn .26s cubic-bezier(.4,0,.2,1)" }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#f1f4f6] px-6 py-[22px]">
              <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
                신고 처리 대기열
              </h2>
              <button
                onClick={() => setQueueOpen(false)}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#eef1f3] bg-white text-slate-500 hover:bg-slate-100"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </button>
            </div>

            <div className="px-6 pt-4">
              <div className="flex w-full gap-1 rounded-[11px] bg-slate-100 p-1">
                <button
                  onClick={() => setQueueTab("members")}
                  className={[
                    "flex-1 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold",
                    queueTab === "members"
                      ? "bg-white text-teal-600 shadow-sm"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  회원 신고 · {reportedUsers.length}
                </button>
                <button
                  onClick={() => setQueueTab("posts")}
                  className={[
                    "flex-1 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold",
                    queueTab === "posts"
                      ? "bg-white text-teal-600 shadow-sm"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  글 신고 · {reportedPosts.length}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {queueTab === "members" ? (
                reportedUsers.length === 0 ? (
                  <p className="py-10 text-center text-[14px] text-slate-400">
                    신고된 회원이 없습니다
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {reportedUsers.map((m) => (
                      <div
                        key={m.user_id}
                        className="flex items-center gap-3 rounded-[12px] border border-[#eef1f3] px-3 py-2.5"
                      >
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-500">
                          <UserIcon className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-bold text-slate-900">
                            {m.name}
                          </div>
                          <div className="mt-0.5 truncate text-[12.5px] text-slate-400">
                            {m.latest_reason} · 신고 {Number(m.report_count)}회
                          </div>
                        </div>
                        <button
                          onClick={() => openUser(m.user_id)}
                          className="flex-shrink-0 whitespace-nowrap rounded-[9px] bg-teal-500 px-3.5 py-[7px] text-[13px] font-bold text-white hover:bg-teal-600"
                        >
                          처리
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : reportedPosts.length === 0 ? (
                <p className="py-10 text-center text-[14px] text-slate-400">
                  신고된 게시글이 없습니다
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {reportedPosts.map((p) => {
                    const ago = daysSince(p.first_reported_at);
                    return (
                      <div
                        key={p.post_id}
                        className="flex items-center gap-3 rounded-[12px] border border-[#eef1f3] px-3 py-2.5"
                      >
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                          <FileText className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-bold text-slate-900">
                            {p.title}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate-400">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                              {POST_TYPE_LABEL[p.post_type] ?? p.post_type}
                            </span>
                            신고 {Number(p.report_count)}건 ·{" "}
                            {ago === 0 ? "오늘" : ago === 1 ? "어제" : `${ago}일 전`}
                          </div>
                        </div>
                        <button
                          onClick={() => openPost(p.post_id)}
                          className="flex-shrink-0 whitespace-nowrap rounded-[9px] bg-teal-500 px-3.5 py-[7px] text-[13px] font-bold text-white hover:bg-teal-600"
                        >
                          처리
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/20">
          <div className="flex items-center gap-2.5 rounded-xl bg-white px-5 py-3 shadow-lg">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-teal-500" />
            <span className="text-[13.5px] font-semibold text-slate-600">
              불러오는 중...
            </span>
          </div>
        </div>
      )}

      {/* 유저 상세 드로어 (#6) */}
      {userDetail && (
        <UserDetailDrawer
          key={userDetail.id}
          user={userDetail}
          onClose={() => setUserDetail(null)}
          onChanged={(userId, patch) => {
            setUserDetail((cur) =>
              cur && cur.id === userId ? { ...cur, ...patch } : cur,
            );
            refresh();
          }}
          onToast={showToast}
        />
      )}

      {/* 게시글 상세 드로어 (#6) */}
      {postDetail && (
        <PostDetailDrawer
          key={postDetail.id}
          post={postDetail}
          onClose={() => setPostDetail(null)}
          onChanged={(postId, patch) => {
            setPostDetail((cur) =>
              cur && cur.id === postId ? { ...cur, ...patch } : cur,
            );
            refresh();
          }}
          onDeleted={() => refresh()}
          onToast={showToast}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-7 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-slate-900 px-5 py-[13px] text-white shadow-[0_10px_30px_rgba(15,23,42,0.3)]"
          style={{ animation: "fadeIn .18s ease" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-[13.5px] font-semibold">{toast}</span>
        </div>
      )}
    </Ctx.Provider>
  );
}
