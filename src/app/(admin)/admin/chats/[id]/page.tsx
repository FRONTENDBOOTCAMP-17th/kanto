import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { getAdminChatMessages } from "@/services/admin/adminChats";
import { POST_TYPE_LABEL } from "@/app/(admin)/admin/_lib/constants";
import { formatDateDivider, formatMessageTime } from "@/utils/formatTime";

export const dynamic = "force-dynamic";

export default async function AdminChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chatId = Number(id);
  if (isNaN(chatId)) notFound();

  const { chat, messages } = await getAdminChatMessages(chatId);
  if (!chat) notFound();

  const user1 = chat.user1;
  const user2 = chat.user2;

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/admin/chats"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        채팅 목록으로
      </Link>

      {/* 참여자 헤더 */}
      <div className="rounded-[18px] border border-[#e7ebee] bg-white px-[22px] py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-teal-500 shrink-0" strokeWidth={2} />
          <div>
            <div className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
              <span>{user1?.name ?? "알 수 없음"}</span>
              <span className="text-slate-300">·</span>
              <span>{user2?.name ?? "알 수 없음"}</span>
            </div>
            {chat.posts && (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11.5px] font-semibold text-slate-500">
                  {POST_TYPE_LABEL[chat.posts.post_type] ?? chat.posts.post_type}
                </span>
                <span className="text-[13px] text-slate-500">{chat.posts.title}</span>
              </div>
            )}
          </div>
          <span className="ml-auto text-[13px] text-slate-400">
            총 {messages.length}개 메시지
          </span>
        </div>
      </div>

      {/* 채팅 뷰 */}
      <div className="overflow-hidden rounded-[18px] border border-[#e7ebee] bg-[#f5f7f8] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-2 px-4 py-5 min-h-[400px]">
          {messages.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-16 text-[14px] text-slate-400">
              메시지가 없습니다.
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser1 = msg.sender?.id === user1?.id;
            const msgDate = new Date(msg.created_at).toDateString();
            const prevDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
            const showDivider = msgDate !== prevDate;

            return (
              <Fragment key={msg.id}>
                {showDivider && (
                  <div className="flex items-center gap-2 my-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">
                      {formatDateDivider(msg.created_at)}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}
                <div className={`flex flex-col gap-0.5 ${isUser1 ? "items-start" : "items-end"}`}>
                  <span className="text-[11px] text-slate-400 px-1">{msg.sender?.name ?? "-"}</span>
                  <div className={`flex items-end gap-1 ${isUser1 ? "" : "flex-row-reverse"}`}>
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-keep ${
                        isUser1
                          ? "bg-white text-gray-800 rounded-tl-sm shadow-sm"
                          : "bg-teal-500 text-white rounded-tr-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <time className="text-[11px] text-slate-400 shrink-0">
                      {formatMessageTime(msg.created_at)}
                    </time>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
