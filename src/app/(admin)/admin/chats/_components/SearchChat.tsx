"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { MessageSquare, X, ExternalLink } from "lucide-react";
import { POST_TYPE_LABEL } from "@/app/(admin)/admin/_lib/constants";
import { fetchChatMessages } from "@/app/(admin)/admin/chats/_actions/fetchChatMessages";
import { applySanction } from "@/app/(admin)/admin/users/_actions/applySanction";
import { liftSanction } from "@/app/(admin)/admin/users/_actions/liftSanction";
import { formatDateDivider, formatMessageTime } from "@/utils/formatTime";

interface ChatRoom {
  id: number;
  created_at: string | null;
  last_message_at: string | null;
  last_message_content: string | null;
  user1: { id: number; name: string | null; suspended_until: string | null } | null;
  user2: { id: number; name: string | null; suspended_until: string | null } | null;
  posts: { title: string; post_type: string } | null;
}

type Tab = "user1" | "user2" | "chat";
type Message = Awaited<ReturnType<typeof fetchChatMessages>>[number];

const PAGE_SIZE = 20;

const POST_TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  used_goods: { bg: "#f0fdfa", fg: "#0d9488" },
  jobs:       { bg: "#faf5ff", fg: "#7c3aed" },
  rental:     { bg: "#eff6ff", fg: "#2563eb" },
  community:  { bg: "#fff7ed", fg: "#c2410c" },
};

export default function SearchChat({ chats }: { chats: ChatRoom[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selId, setSelId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localSuspended, setLocalSuspended] = useState<Record<number, string | null>>({});
  const [isPending, startTransition] = useTransition();
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingScrollToBottom = useRef(false);
  const pendingScrollRestore = useRef<number | null>(null);

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

  const sel = selId != null ? chats.find((c) => c.id === selId) ?? null : null;

  function openDrawer(chatId: number) {
    setSelId(chatId);
    setTab(null);
    setMessages([]);
    setHasMore(false);
  }

  function closeDrawer() {
    setSelId(null);
    setTab(null);
    setMessages([]);
    setHasMore(false);
  }

  async function selectTab(t: Tab) {
    setTab(t);
    if (messages.length === 0 && selId != null) {
      setChatLoading(true);
      try {
        const data = await fetchChatMessages(selId);
        pendingScrollToBottom.current = t === "chat";
        setMessages(data);
        setHasMore(data.length >= 20);
      } finally {
        setChatLoading(false);
      }
    }
  }

  async function loadMoreMessages() {
    if (!selId || loadingMore || !hasMore || messages.length === 0) return;
    const container = chatScrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    setLoadingMore(true);
    try {
      const older = await fetchChatMessages(selId, messages[0].created_at);
      if (older.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(older.length >= 20);
        pendingScrollRestore.current = prevScrollHeight;
        setMessages((prev) => [...older, ...prev]);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (pendingScrollToBottom.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" as ScrollBehavior });
      pendingScrollToBottom.current = false;
    } else if (pendingScrollRestore.current !== null && chatScrollRef.current) {
      chatScrollRef.current.scrollTop =
        chatScrollRef.current.scrollHeight - pendingScrollRestore.current;
      pendingScrollRestore.current = null;
    }
  }, [messages]);

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
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="참여자 이름 또는 게시글 제목으로 검색..."
          className="flex-1 border-none bg-transparent text-[14px] text-slate-900 outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[18px] border border-[#e7ebee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-[#f1f4f6] bg-slate-50">
                {["참여자", "관련 게시글", "마지막 메시지", "최근 대화"].map((h) => (
                  <th key={h} className="px-[18px] py-[13px] text-left text-[12px] font-bold uppercase tracking-wide text-slate-400">{h}</th>
                ))}
                <th className="px-[18px] py-[13px] text-right text-[12px] font-bold uppercase tracking-wide text-slate-400">액션</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((chat) => (
                <tr key={chat.id} className="border-t border-[#f3f5f7] hover:bg-slate-50">
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
                        <span className="mr-1.5 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11.5px] font-semibold text-slate-600">
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
                        onClick={() => openDrawer(chat.id)}
                        className="cursor-pointer whitespace-nowrap rounded-[9px] border border-[#e2e8eb] bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
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
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-[34px] rounded-[9px] border border-[#e7ebee] bg-white px-[13px] text-[13px] font-semibold" style={{ color: curPage <= 1 ? "#cbd5e1" : "#475569" }}>이전</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className={["h-[34px] min-w-[34px] rounded-[9px] px-2 text-[13px]", n === curPage ? "border-none bg-teal-500 font-bold text-white" : "border border-[#e7ebee] bg-white font-semibold text-slate-600"].join(" ")}>{n}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-[34px] rounded-[9px] border border-[#e7ebee] bg-white px-[13px] text-[13px] font-semibold" style={{ color: curPage >= totalPages ? "#cbd5e1" : "#475569" }}>다음</button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selId != null && sel && (
        <>
          <div onClick={closeDrawer} className="fixed inset-0 z-[70] bg-slate-900/45" style={{ animation: "fadeIn .18s ease" }} />
          <div
            className="fixed right-0 top-0 z-[71] flex h-screen w-[520px] max-w-full flex-col bg-white shadow-[-12px_0_44px_rgba(15,23,42,0.18)]"
            style={{ animation: "drawerIn .26s cubic-bezier(.4,0,.2,1)" }}
          >
            {/* drawer header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#f1f4f6] px-6 py-[22px]">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-5 w-5 text-teal-500" strokeWidth={2.2} />
                <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">채팅 상세</h2>
                <span className="text-[12.5px] font-semibold text-slate-400">#{sel.id}</span>
              </div>
              <button onClick={closeDrawer} className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#eef1f3] bg-white text-slate-500 hover:bg-slate-100">
                <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </button>
            </div>

            {/* 게시물 정보 + 최근 대화 */}
            <div className="border-b border-[#f1f4f6] px-6 py-4">
              {sel.posts ? (
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                  {(() => {
                    const c = POST_TYPE_COLOR[sel.posts.post_type] ?? { bg: "#f1f5f9", fg: "#64748b" };
                    return (
                      <span className="inline-flex items-center rounded-full px-[11px] py-1 text-[12px] font-bold" style={{ background: c.bg, color: c.fg }}>
                        {POST_TYPE_LABEL[sel.posts.post_type] ?? sel.posts.post_type}
                      </span>
                    );
                  })()}
                  <span className="text-[14px] font-bold text-slate-900">{sel.posts.title}</span>
                </div>
              ) : (
                <div className="mb-2 text-[13px] text-slate-400">관련 게시글 없음</div>
              )}
              <div className="flex items-center gap-2 text-[13px] text-slate-500">
                <span className="truncate max-w-[320px]">
                  {sel.last_message_content ? `"${sel.last_message_content}"` : "메시지 없음"}
                </span>
                {sel.last_message_at && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="shrink-0 text-slate-400">{sel.last_message_at.split("T")[0]}</span>
                  </>
                )}
              </div>
            </div>

            {/* 탭 버튼 */}
            <div className="flex gap-2 border-b border-[#f1f4f6] px-6 py-4">
              {([
                { key: "user1" as Tab, label: sel.user1?.name ?? "사용자 1" },
                { key: "user2" as Tab, label: sel.user2?.name ?? "사용자 2" },
                { key: "chat" as Tab, label: "채팅 내역" },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => selectTab(key)}
                  className={[
                    "flex-1 whitespace-nowrap rounded-[10px] py-[10px] text-[13px] font-bold transition-colors",
                    tab === key
                      ? key === "chat"
                        ? "bg-teal-500 text-white shadow-[0_2px_8px_rgba(20,184,166,0.28)]"
                        : "bg-slate-800 text-white"
                      : "border border-[#e7ebee] bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 탭 컨텐츠 */}
            <div
              ref={tab === "chat" ? chatScrollRef : undefined}
              onScroll={tab === "chat" ? (e) => { if (e.currentTarget.scrollTop < 80) loadMoreMessages(); } : undefined}
              className={`flex-1 overflow-y-auto ${tab === "chat" ? "bg-[#f5f7f8]" : "bg-white"} p-6`}
            >

              {/* 선택 안 됨 */}
              {tab === null && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare className="h-10 w-10 text-slate-200" strokeWidth={1.8} />
                  <div className="mt-4 text-[14px] font-semibold text-slate-400">
                    위 버튼을 눌러 내용을 확인하세요
                  </div>
                </div>
              )}

              {/* 사용자 1 / 사용자 2 — 유저 카드 + 제재 버튼 + 발화 텍스트 로그 */}
              {(tab === "user1" || tab === "user2") && (() => {
                const user = tab === "user1" ? sel.user1 : sel.user2;
                if (!user) return (
                  <div className="py-8 text-center text-[13px] text-slate-400">유저 정보 없음</div>
                );
                const filtered = messages.filter((m) => m.sender?.id === user.id);
                const effectiveSuspended = user.id in localSuspended
                  ? localSuspended[user.id]
                  : user.suspended_until;
                const isSuspended = !!effectiveSuspended && new Date(effectiveSuspended) > new Date();

                function doSanction(type: "7d" | "30d" | "perm") {
                  startTransition(async () => {
                    await applySanction(user!.id, type);
                    const now = new Date();
                    const exp = type === "7d"
                      ? new Date(now.getTime() + 7 * 86400000).toISOString()
                      : type === "30d"
                        ? new Date(now.getTime() + 30 * 86400000).toISOString()
                        : "9999-12-31T00:00:00Z";
                    setLocalSuspended((prev) => ({ ...prev, [user!.id]: exp }));
                  });
                }

                function doLift() {
                  startTransition(async () => {
                    await liftSanction(user!.id);
                    setLocalSuspended((prev) => ({ ...prev, [user!.id]: null }));
                  });
                }

                return (
                  <div className="flex flex-col gap-4">
                    {/* 유저 카드 */}
                    <div className="rounded-[14px] border border-[#eef1f3] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[16px] font-extrabold text-slate-900">{user.name ?? "-"}</div>
                          <div className="mt-0.5 text-[12px] text-slate-400">ID #{user.id}</div>
                        </div>
                        <a
                          href={`/admin/users/${user.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-[8px] border border-[#e7ebee] bg-slate-50 px-3 py-[7px] text-[12.5px] font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          상세 보기 <ExternalLink className="h-[13px] w-[13px]" strokeWidth={2.2} />
                        </a>
                      </div>
                      {isSuspended && (
                        <div className="mt-2 rounded-[8px] bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">
                          정지 중 · 만료: {effectiveSuspended === "9999-12-31T00:00:00Z" ? "영구" : effectiveSuspended?.slice(0, 10)}
                        </div>
                      )}
                      {/* 제재 버튼 */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <button
                          onClick={doLift}
                          disabled={isPending || !isSuspended}
                          className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-[6px] text-[12px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          제재 해제
                        </button>
                        {(["7d", "30d", "perm"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => doSanction(t)}
                            disabled={isPending}
                            className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-[6px] text-[12px] font-bold text-red-600 hover:bg-red-100 disabled:opacity-40"
                          >
                            {t === "7d" ? "7일 정지" : t === "30d" ? "30일 정지" : "영구 정지"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 발화 텍스트 로그 */}
                    {chatLoading && (
                      <div className="py-8 text-center text-[13px] text-slate-400">불러오는 중...</div>
                    )}
                    {!chatLoading && filtered.length === 0 && (
                      <div className="py-8 text-center text-[13px] text-slate-400">발화 기록이 없습니다.</div>
                    )}
                    {!chatLoading && filtered.length > 0 && (
                      <div className="rounded-[14px] border border-[#eef1f3] bg-white">
                        <div className="border-b border-[#f1f4f6] px-4 py-3 text-[12px] font-bold text-slate-400">
                          발화 기록 ({filtered.length}건)
                        </div>
                        <div className="max-h-[360px] divide-y divide-[#f5f7f8] overflow-y-auto">
                          {filtered.map((msg) => (
                            <div key={msg.id} className="flex items-start gap-3 px-4 py-3">
                              <time className="shrink-0 pt-px text-[11.5px] text-slate-400">
                                {new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(msg.created_at))}
                              </time>
                              <span className="break-all text-[13px] leading-relaxed text-slate-700">{msg.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 채팅 내역 */}
              {tab === "chat" && (
                <>
                  {chatLoading && (
                    <div className="flex items-center justify-center py-16 text-[14px] text-slate-400">
                      불러오는 중...
                    </div>
                  )}
                  {!chatLoading && messages.length === 0 && (
                    <div className="flex items-center justify-center py-16 text-[14px] text-slate-400">
                      메시지가 없습니다.
                    </div>
                  )}
                  {!chatLoading && messages.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {loadingMore && (
                        <div className="py-3 text-center text-[12px] text-slate-400">이전 메시지 불러오는 중...</div>
                      )}
                      {!hasMore && (
                        <div className="py-2 text-center text-[11.5px] text-slate-300">— 처음 메시지입니다 —</div>
                      )}
                      {messages.map((msg, index) => {
                        const isUser1 = msg.sender?.id === sel?.user1?.id;
                        const msgDate = new Date(msg.created_at).toDateString();
                        const prevDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
                        const showDivider = msgDate !== prevDate;
                        return (
                          <Fragment key={msg.id}>
                            {showDivider && (
                              <div className="my-1 flex items-center gap-2">
                                <div className="h-px flex-1 bg-gray-200" />
                                <span className="text-xs text-gray-400">{formatDateDivider(msg.created_at)}</span>
                                <div className="h-px flex-1 bg-gray-200" />
                              </div>
                            )}
                            <div className={`flex flex-col gap-0.5 ${isUser1 ? "items-start" : "items-end"}`}>
                              <span className="px-1 text-[11px] text-slate-400">{msg.sender?.name ?? "-"}</span>
                              <div className={`flex items-end gap-1 ${isUser1 ? "" : "flex-row-reverse"}`}>
                                <div className={`max-w-[72%] break-keep rounded-2xl px-3 py-2 text-sm leading-relaxed ${isUser1 ? "rounded-tl-sm bg-white text-gray-800 shadow-sm" : "rounded-tr-sm bg-teal-500 text-white"}`}>
                                  {msg.content}
                                </div>
                                <time className="shrink-0 text-[11px] text-slate-400">{formatMessageTime(msg.created_at)}</time>
                              </div>
                            </div>
                          </Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* footer */}
            <div className="border-t border-[#f1f4f6] px-6 py-[18px]">
              {tab === "chat" && !chatLoading && messages.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-slate-400">
                      로드된 메시지 <span className="font-semibold text-slate-600">{messages.length}</span>개
                      {hasMore && <span className="ml-1 text-slate-300">(더 있음)</span>}
                    </span>
                    <button
                      onClick={() => {
                        const postLine = sel.posts
                          ? `게시글: [${POST_TYPE_LABEL[sel.posts.post_type] ?? sel.posts.post_type}] ${sel.posts.title}\n`
                          : "";
                        const header = [
                          "=== 채팅 기록 ===",
                          `채팅방 ID: #${sel.id}`,
                          `참여자: ${sel.user1?.name ?? "-"} · ${sel.user2?.name ?? "-"}`,
                          postLine.trim(),
                          `내보낸 시각: ${new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date())}`,
                          "",
                          "---",
                          "",
                        ].filter((l) => l !== undefined && !(l === "" && postLine.trim() === "")).join("\n");

                        const body = messages
                          .map((msg) => {
                            const dt = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(msg.created_at));
                            return `[${dt}] ${msg.sender?.name ?? "알 수 없음"}: ${msg.content}`;
                          })
                          .join("\n");

                        const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `chat_${sel.id}_${new Date().toISOString().slice(0, 10)}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#e2e8eb] bg-white px-3 py-[7px] text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      TXT 다운로드
                    </button>
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="w-full rounded-[11px] border border-[#e2e8eb] bg-slate-50 py-[10px] text-[14px] font-bold text-slate-600 hover:bg-slate-100"
                  >
                    닫기
                  </button>
                </div>
              ) : (
                <button
                  onClick={closeDrawer}
                  className="w-full rounded-[11px] border border-[#e2e8eb] bg-slate-50 py-[10px] text-[14px] font-bold text-slate-600 hover:bg-slate-100"
                >
                  닫기
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
