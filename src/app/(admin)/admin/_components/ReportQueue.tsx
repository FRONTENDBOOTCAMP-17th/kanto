"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye } from "lucide-react";
import { CATEGORY, POST_TYPE_LABEL } from "../_lib/constants";
import { daysSince } from "../_lib/utils";
import type { Category, ReportedUser, ReportedPost } from "@/type/admin";
import Card from "./Card";
import { useReportCenter } from "./DashboardReportCenter";

function reportStatusFromCount(count: number) {
  if (count >= 5)
    return { label: "경고", sc: "#dc2626", sb: "#fef2f2", ab: "#fee2e2", ac: "#dc2626" };
  if (count >= 3)
    return { label: "주의", sc: "#d97706", sb: "#fffbeb", ab: "#fef3c7", ac: "#d97706" };
  if (count >= 2)
    return { label: "검토중", sc: "#2563eb", sb: "#eff6ff", ab: "#dbeafe", ac: "#2563eb" };
  return { label: "확인중", sc: "#64748b", sb: "#f1f5f9", ab: "#e2e8f0", ac: "#64748b" };
}

interface Props {
  pendingTotal: number;
  reportedUsers: ReportedUser[];
  reportedPosts: ReportedPost[];
}

export default function ReportQueue({
  pendingTotal,
  reportedUsers,
  reportedPosts,
}: Props) {
  const [tab, setTab] = useState<"members" | "posts">("members");
  const { openUser, openPost } = useReportCenter();

  return (
    <Card className="flex h-[520px] min-w-0 flex-[1.3_1_440px] flex-col overflow-hidden">
      <div className="mb-3.5 flex items-center gap-2.5">
        <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
          신고 처리 큐
        </h2>
        <span className="rounded-full bg-red-50 px-2.5 py-[3px] text-[12px] font-bold text-red-600">
          {pendingTotal}건 대기
        </span>
      </div>
      <div className="mb-2 flex w-full gap-1 rounded-[11px] bg-slate-100 p-1">
        <button
          onClick={() => setTab("members")}
          className={[
            "flex-1 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold",
            tab === "members"
              ? "bg-white text-teal-600 shadow-sm"
              : "text-slate-500",
          ].join(" ")}
        >
          신고된 회원 · {reportedUsers.length}
        </button>
        <button
          onClick={() => setTab("posts")}
          className={[
            "flex-1 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold",
            tab === "posts"
              ? "bg-white text-teal-600 shadow-sm"
              : "text-slate-500",
          ].join(" ")}
        >
          신고된 게시글 · {reportedPosts.length}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "members" ? (
          <div className="flex flex-col">
            {reportedUsers.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-slate-400">
                신고된 회원이 없습니다
              </p>
            ) : (
              reportedUsers.slice(0, 4).map((m) => {
                const st = reportStatusFromCount(Number(m.report_count));
                return (
                  <div
                    key={m.user_id}
                    className="flex cursor-pointer items-center gap-3 border-t border-[#f3f5f7] px-1.5 py-3 hover:bg-slate-50"
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold"
                      style={{ background: st.ab, color: st.ac }}
                    >
                      {m.avatar_url ? (
                        <Image
                          src={m.avatar_url}
                          alt={m.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        m.name[0]
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[14.5px] font-bold text-slate-900">
                          {m.name}
                        </span>
                        <span
                          className="whitespace-nowrap rounded-md px-[7px] py-0.5 text-[11.5px] font-bold"
                          style={{ background: st.sb, color: st.sc }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[12.5px] text-slate-400">
                        {m.latest_reason} · 신고 {Number(m.report_count)}회
                      </div>
                    </div>
                    <button
                      onClick={() => openUser(m.user_id)}
                      className="flex-shrink-0 whitespace-nowrap rounded-[9px] border border-[#e2e8eb] bg-[#eef2f6] px-3.5 py-[7px] text-[13px] font-bold text-slate-700 hover:bg-slate-200"
                    >
                      처리
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {reportedPosts.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-slate-400">
                신고된 게시글이 없습니다
              </p>
            ) : (
              reportedPosts.slice(0, 4).map((p) => {
                const cat = (POST_TYPE_LABEL[p.post_type] ?? "커뮤니티") as Category;
                const ago = daysSince(p.first_reported_at);
                return (
                  <div
                    key={p.post_id}
                    className="flex cursor-pointer items-center gap-3 border-t border-[#f3f5f7] px-1.5 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-bold text-slate-900">
                        {p.title}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          className="inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                          style={{
                            background: CATEGORY[cat]?.bg ?? "#f8fafc",
                            color: CATEGORY[cat]?.fg ?? "#64748b",
                          }}
                        >
                          {cat}
                        </span>
                        <span className="whitespace-nowrap text-[12.5px] text-slate-400">
                          신고 {Number(p.report_count)}건 ·{" "}
                          {ago === 0 ? "오늘" : ago === 1 ? "어제" : `${ago}일 전`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => openPost(p.post_id)}
                      className="flex-shrink-0 whitespace-nowrap rounded-[9px] border border-[#e2e8eb] bg-[#eef2f6] px-3.5 py-[7px] text-[13px] font-bold text-slate-700 hover:bg-slate-200"
                    >
                      처리
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-[#f1f4f6] pt-4">
        <a
          href={tab === "members" ? "/admin/users" : "/admin/posts"}
          className="flex w-full items-center justify-center gap-1.5 rounded-[11px] border border-[#e2e8eb] bg-[#f8fafc] py-2.5 text-[13.5px] font-semibold text-slate-600 hover:bg-slate-100"
        >
          <Eye className="h-[15px] w-[15px]" strokeWidth={2} />
          {tab === "members"
            ? `회원 관리 전체 보기${reportedUsers.length > 4 ? ` (+${reportedUsers.length - 4}건)` : ""}`
            : `글 관리 전체 보기${reportedPosts.length > 4 ? ` (+${reportedPosts.length - 4}건)` : ""}`}
        </a>
      </div>
    </Card>
  );
}
