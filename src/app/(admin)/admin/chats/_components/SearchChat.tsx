"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { POST_TYPE_LABEL } from "@/app/(admin)/admin/_lib/constants";

interface ChatRoom {
  id: number;
  created_at: string | null;
  last_message_at: string | null;
  last_message_content: string | null;
  user1: { id: number; name: string | null } | null;
  user2: { id: number; name: string | null } | null;
  posts: { title: string; post_type: string } | null;
}

const PAGE_SIZE = 20;

export default function SearchChat({ chats }: { chats: ChatRoom[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();

  const filtered = chats.filter((chat) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      chat.user1?.name?.toLowerCase().includes(keyword) ||
      chat.user2?.name?.toLowerCase().includes(keyword) ||
      chat.posts?.title?.toLowerCase().includes(keyword)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const startIdx = (curPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-7 w-7 text-teal-500" strokeWidth={2.2} />
            <h1 className="whitespace-nowrap text-[31px] font-extrabold tracking-tight text-slate-900">
              채팅 기록
            </h1>
          </div>
          <p className="mt-2 text-[15px] text-slate-500">
            유저 간의 채팅 내역을 조회하세요
          </p>
        </div>
        <div className="whitespace-nowrap rounded-[11px] border border-[#e7ebee] bg-white px-[14px] py-[9px] text-[13px] font-medium text-slate-500">
          총 <span className="font-bold text-slate-900">{chats.length}</span>개 채팅방
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
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="참여자 이름 또는 게시글 제목으로 검색..."
          className="flex-1 border-none bg-transparent text-[14px] text-slate-900 outline-none"
        />
      </div>

      {/* 데스크탑 테이블 */}
      <div className="hidden md:block overflow-hidden rounded-[18px] border border-[#e7ebee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-[#f1f4f6] bg-slate-50">
                {["참여자", "관련 게시글", "마지막 메시지", "최근 대화"].map((h) => (
                  <th key={h} className="px-[18px] py-[13px] text-left text-[12px] font-bold uppercase tracking-wide text-slate-400">
                    {h}
                  </th>
                ))}
                <th className="px-[18px] py-[13px] text-right text-[12px] font-bold uppercase tracking-wide text-slate-400">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((chat) => (
                <tr
                  key={chat.id}
                  onClick={() => router.push(`/admin/chats/${chat.id}`)}
                  className="cursor-pointer border-t border-[#f3f5f7] hover:bg-slate-50"
                >
                  <td className="px-[18px] py-[15px]">
                    <div className="flex items-center gap-1.5 text-[14px] font-bold text-slate-900">
                      <span>{chat.user1?.name ?? "-"}</span>
                      <span className="text-slate-300">·</span>
                      <span>{chat.user2?.name ?? "-"}</span>
                    </div>
                  </td>
                  <td className="px-[18px] py-[15px]">
                    {chat.posts ? (
                      <div>
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11.5px] font-semibold text-slate-600 mr-1.5">
                          {POST_TYPE_LABEL[chat.posts.post_type] ?? chat.posts.post_type}
                        </span>
                        <span className="text-[13.5px] text-slate-700">{chat.posts.title}</span>
                      </div>
                    ) : (
                      <span className="text-[13px] text-slate-400">-</span>
                    )}
                  </td>
                  <td className="max-w-[200px] px-[18px] py-[15px]">
                    <span className="block truncate text-[13.5px] text-slate-500">
                      {chat.last_message_content ?? "-"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-[18px] py-[15px] text-[13.5px] text-slate-400">
                    {chat.last_message_at?.split("T")[0] ?? "-"}
                  </td>
                  <td className="px-[18px] py-[15px]">
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/chats/${chat.id}`); }}
                        className="whitespace-nowrap rounded-[9px] border border-[#e2e8eb] bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        보기
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <MessageSquare className="h-12 w-12 text-slate-200" strokeWidth={1.8} />
            <div className="mt-4 text-[15px] font-bold text-slate-500">채팅방이 없습니다</div>
            <div className="mt-[5px] text-[13.5px] text-slate-400">검색어를 변경해보세요</div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f4f6] px-[22px] py-4">
            <span className="text-[13px] text-slate-400">
              총 <span className="font-semibold text-slate-600">{filtered.length}</span>건 중{" "}
              <span className="font-semibold text-slate-600">
                {filtered.length === 0 ? "0" : `${startIdx + 1}–${startIdx + pageItems.length}`}
              </span>{" "}표시
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

      {/* 모바일 카드 */}
      <div className="md:hidden space-y-3">
        {pageItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-12 w-12 text-slate-200" strokeWidth={1.8} />
            <div className="mt-4 text-[15px] font-bold text-slate-500">채팅방이 없습니다</div>
            <div className="mt-[5px] text-[13.5px] text-slate-400">검색어를 변경해보세요</div>
          </div>
        )}
        {pageItems.map((chat) => (
          <button
            key={chat.id}
            onClick={() => router.push(`/admin/chats/${chat.id}`)}
            className="w-full text-left block rounded-xl border border-[#e7ebee] bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span>{chat.user1?.name ?? "-"}</span>
                <span className="text-slate-300">·</span>
                <span>{chat.user2?.name ?? "-"}</span>
              </div>
              <span className="text-[12px] text-slate-400 shrink-0">
                {chat.last_message_at?.split("T")[0] ?? "-"}
              </span>
            </div>
            {chat.posts && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {POST_TYPE_LABEL[chat.posts.post_type] ?? chat.posts.post_type}
                </span>
                <span className="text-[12.5px] text-slate-600 truncate">{chat.posts.title}</span>
              </div>
            )}
            {chat.last_message_content && (
              <p className="mt-2 truncate text-[13px] text-slate-400">
                {chat.last_message_content}
              </p>
            )}
          </button>
        ))}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 pt-2">
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
        )}
      </div>
    </div>
  );
}
